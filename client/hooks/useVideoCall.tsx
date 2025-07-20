import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthUser } from './useAuthUser';
import { 
  createVideoCall, 
  getVideoCall, 
  joinVideoCall, 
  leaveVideoCall, 
  sendVideoCallSignal, 
  subscribeToVideoCallSignals, 
  subscribeToVideoCall,
  cleanupVideoCall
} from '@/lib/firestore-utils';
import { sendCallNotification, updateCallStatus, endCall, sendCallEndedNotification } from '@/lib/call-notification-service';
import { VideoCall, VideoCallSignal } from '@/lib/firestore-structure';

interface VideoCallState {
  isInCall: boolean;
  isConnecting: boolean;
  participants: any[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  error: string | null;
  connectionStatus: Map<string, string>;
  connectionTimeouts: Map<string, NodeJS.Timeout>;
}

export function useVideoCall(groupId: string, groupName?: string) {
  const { firebaseUser } = useAuthUser();
  const [state, setState] = useState<VideoCallState>({
    isInCall: false,
    isConnecting: false,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoOff: false,
    error: null,
    connectionStatus: new Map(),
    connectionTimeouts: new Map(),
  });

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoCallRef = useRef<VideoCall | null>(null);
  const unsubscribeSignals = useRef<(() => void) | null>(null);
  const unsubscribeVideoCall = useRef<(() => void) | null>(null);
  const pendingCandidates = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const connectionAttempts = useRef<Map<string, number>>(new Map());

  // Enhanced STUN/TURN configuration
  const getIceServers = useCallback(() => {
    return [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Free TURN servers (for production, use your own TURN server)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];
  }, []);

  // Set connection timeout
  const setConnectionTimeout = useCallback((peerId: string, timeoutMs: number = 15000) => {
    // Clear existing timeout
    const existingTimeout = state.connectionTimeouts.get(peerId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      console.error(`Connection timeout for ${peerId}`);
      setState(prev => {
        const newConnectionStatus = new Map(prev.connectionStatus);
        newConnectionStatus.set(peerId, 'timeout');
        return { 
          ...prev, 
          connectionStatus: newConnectionStatus,
          error: `Connection timeout with ${peerId}. Please check your network connection.`
        };
      });
    }, timeoutMs);

    setState(prev => {
      const newTimeouts = new Map(prev.connectionTimeouts);
      newTimeouts.set(peerId, timeout);
      return { ...prev, connectionTimeouts: newTimeouts };
    });
  }, [state.connectionTimeouts]);

  // Clear connection timeout
  const clearConnectionTimeout = useCallback((peerId: string) => {
    const timeout = state.connectionTimeouts.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      setState(prev => {
        const newTimeouts = new Map(prev.connectionTimeouts);
        newTimeouts.delete(peerId);
        return { ...prev, connectionTimeouts: newTimeouts };
      });
    }
  }, [state.connectionTimeouts]);

  // Initialize WebRTC peer connection with enhanced logging and TURN servers
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    console.log(`Creating peer connection for ${peerId}`);
    
    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Adding track to peer connection: ${track.kind}`);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates with enhanced logging
    pc.onicecandidate = (event) => {
      console.log(`ICE candidate for ${peerId}:`, event.candidate);
      if (event.candidate) {
        sendVideoCallSignal({
          groupId,
          fromUserId: firebaseUser!.uid,
          toUserId: peerId,
          type: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}:`, pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        clearConnectionTimeout(peerId);
        console.log(`✅ Connection established with ${peerId}`);
      } else if (pc.iceConnectionState === 'failed') {
        clearConnectionTimeout(peerId);
        console.error(`❌ ICE connection failed with ${peerId}`);
        
        // Retry connection if attempts < 3
        const attempts = connectionAttempts.current.get(peerId) || 0;
        if (attempts < 3) {
          console.log(`🔄 Retrying connection with ${peerId} (attempt ${attempts + 1})`);
          connectionAttempts.current.set(peerId, attempts + 1);
          
          // Close and recreate connection
          pc.close();
          peerConnections.current.delete(peerId);
          
          // Recreate connection after delay
          setTimeout(() => {
            const newPc = createPeerConnection(peerId);
            // Re-send offer/answer if needed
            handleReconnection(peerId, newPc);
          }, 2000);
        } else {
          setState(prev => ({ 
            ...prev, 
            error: `Failed to connect with ${peerId} after 3 attempts. Please check your network.`
          }));
        }
      }
      
      setState(prev => {
        const newConnectionStatus = new Map(prev.connectionStatus);
        newConnectionStatus.set(peerId, pc.iceConnectionState);
        return { ...prev, connectionStatus: newConnectionStatus };
      });
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log(`Signaling state for ${peerId}:`, pc.signalingState);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error(`Connection failed with ${peerId}`);
        setState(prev => ({ ...prev, error: `Connection failed with ${peerId}` }));
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`✅ Received remote stream from ${peerId}:`, event.streams[0]);
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams);
        newRemoteStreams.set(peerId, event.streams[0]);
        return { ...prev, remoteStreams: newRemoteStreams };
      });
    };

    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state for ${peerId}:`, pc.iceGatheringState);
    };

    // Set connection timeout
    setConnectionTimeout(peerId);

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [groupId, firebaseUser, getIceServers, setConnectionTimeout, clearConnectionTimeout]);

  // Handle reconnection logic
  const handleReconnection = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    // If we're the initiator, send a new offer
    const existingPc = peerConnections.current.get(peerId);
    if (!existingPc) {
      console.log(`Sending reconnection offer to ${peerId}`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await sendVideoCallSignal({
        groupId,
        fromUserId: firebaseUser!.uid,
        toUserId: peerId,
        type: 'offer',
        data: offer,
      });
    }
  }, [groupId, firebaseUser]);

  // Start video call
  const startCall = useCallback(async () => {
    if (!firebaseUser) return;

    // Prevent multiple simultaneous calls
    if (state.isInCall || state.isConnecting) {
      console.log('🚫 Call already in progress, ignoring start request');
      return;
    }

    console.log('🚀 Starting video call...');
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('✅ Media stream obtained:', stream.getTracks().map(t => t.kind));
      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));

      // Check if call already exists
      let videoCall = await getVideoCall(groupId);
      
      if (!videoCall) {
        // Create new call
        const roomId = crypto.randomUUID();
        videoCall = await createVideoCall(groupId, roomId);
        console.log('📞 Created new video call:', roomId);
        
        // Send call notification to group members
        if (groupName && firebaseUser) {
          await sendCallNotification(
            groupId,
            firebaseUser.uid,
            firebaseUser.displayName || 'Anonymous',
            groupName
          );
        }
      } else {
        console.log('🔗 Joining existing video call');
      }

      videoCallRef.current = videoCall;

      // Join the call
      await joinVideoCall(groupId, firebaseUser.uid, firebaseUser.displayName || 'Anonymous');

      // Subscribe to video call updates
      unsubscribeVideoCall.current = subscribeToVideoCall(groupId, (updatedVideoCall) => {
        if (updatedVideoCall) {
          console.log('👥 Video call updated:', updatedVideoCall.participants);
          videoCallRef.current = updatedVideoCall;
          setState(prev => ({ ...prev, participants: updatedVideoCall.participants }));
          
          // Handle new participants joining - only if we're already in the call
          if (state.isInCall) {
            const newParticipants = updatedVideoCall.participants.filter(
              p => p.userId !== firebaseUser.uid && !peerConnections.current.has(p.userId)
            );
            
            newParticipants.forEach(participant => {
              console.log(`🆕 New participant joined: ${participant.userId}`);
              // Create offer for new participant
              const pc = createPeerConnection(participant.userId);
              
              pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                return sendVideoCallSignal({
                  groupId,
                  fromUserId: firebaseUser.uid,
                  toUserId: participant.userId,
                  type: 'offer',
                  data: offer,
                });
              }).then(() => {
                console.log(`📤 Sent offer to new participant ${participant.userId}`);
              }).catch(error => {
                console.error(`❌ Error creating offer for ${participant.userId}:`, error);
              });
            });
          }
        }
      });

      // Subscribe to signaling
      unsubscribeSignals.current = subscribeToVideoCallSignals(groupId, (signals) => {
        console.log('📡 Received signals:', signals);
        handleSignals(signals);
      });

      setState(prev => ({ 
        ...prev, 
        isInCall: true, 
        isConnecting: false,
        participants: videoCall?.participants || []
      }));

      // Update call status to active
      await updateCallStatus(groupId, 'active');

    } catch (error) {
      console.error('❌ Error starting call:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to start call'
      }));
    }
  }, [groupId, firebaseUser, createPeerConnection, groupName, state.isInCall, state.isConnecting]);

  // Handle incoming signals with enhanced logging
  const handleSignals = useCallback(async (signals: VideoCallSignal[]) => {
    if (!firebaseUser) return;

    for (const signal of signals) {
      // Skip our own signals
      if (signal.fromUserId === firebaseUser.uid) continue;

      console.log(`📨 Processing signal from ${signal.fromUserId}:`, signal.type);

      try {
        switch (signal.type) {
          case 'offer':
            await handleOffer(signal);
            break;
          case 'answer':
            await handleAnswer(signal);
            break;
          case 'ice-candidate':
            await handleIceCandidate(signal);
            break;
          case 'join':
            await handlePeerJoin(signal);
            break;
          case 'leave':
            await handlePeerLeave(signal);
            break;
        }
      } catch (error) {
        console.error('❌ Error handling signal:', error);
      }
    }
  }, [firebaseUser]);

  // Handle incoming offer with enhanced logging
  const handleOffer = useCallback(async (signal: VideoCallSignal) => {
    console.log(`📥 Handling offer from ${signal.fromUserId}`);
    
    const pc = createPeerConnection(signal.fromUserId);
    
    try {
      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      console.log(`✅ Set remote description for ${signal.fromUserId}`);
      
      // Create and set local answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`✅ Created and set local answer for ${signal.fromUserId}`);

      // Send answer
      await sendVideoCallSignal({
        groupId,
        fromUserId: firebaseUser!.uid,
        toUserId: signal.fromUserId,
        type: 'answer',
        data: answer,
      });
      console.log(`📤 Sent answer to ${signal.fromUserId}`);

      // Add any pending ICE candidates
      const pending = pendingCandidates.current.get(signal.fromUserId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(candidate);
        console.log(`✅ Added pending ICE candidate for ${signal.fromUserId}`);
      }
      pendingCandidates.current.delete(signal.fromUserId);
    } catch (error) {
      console.error(`❌ Error handling offer from ${signal.fromUserId}:`, error);
    }
  }, [createPeerConnection, firebaseUser, groupId]);

  // Handle incoming answer with enhanced logging
  const handleAnswer = useCallback(async (signal: VideoCallSignal) => {
    console.log(`📥 Handling answer from ${signal.fromUserId}`);
    
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        console.log(`✅ Set remote description (answer) for ${signal.fromUserId}`);
        
        // Add any pending ICE candidates
        const pending = pendingCandidates.current.get(signal.fromUserId) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(candidate);
          console.log(`✅ Added pending ICE candidate for ${signal.fromUserId}`);
        }
        pendingCandidates.current.delete(signal.fromUserId);
      } catch (error) {
        console.error(`❌ Error handling answer from ${signal.fromUserId}:`, error);
      }
    } else {
      console.warn(`⚠️ No peer connection found for ${signal.fromUserId}`);
    }
  }, []);

  // Handle ICE candidate with enhanced logging
  const handleIceCandidate = useCallback(async (signal: VideoCallSignal) => {
    console.log(`🧊 Handling ICE candidate from ${signal.fromUserId}`);
    
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.data));
        console.log(`✅ Added ICE candidate for ${signal.fromUserId}`);
      } catch (error) {
        console.error(`❌ Error adding ICE candidate for ${signal.fromUserId}:`, error);
      }
    } else {
      // Store candidate for later if peer connection doesn't exist yet
      console.log(`📦 Storing ICE candidate for ${signal.fromUserId} (PC not ready)`);
      const pending = pendingCandidates.current.get(signal.fromUserId) || [];
      pending.push(new RTCIceCandidate(signal.data));
      pendingCandidates.current.set(signal.fromUserId, pending);
    }
  }, []);

  // Handle peer join with enhanced logging
  const handlePeerJoin = useCallback(async (signal: VideoCallSignal) => {
    if (signal.fromUserId === firebaseUser!.uid) return;

    console.log(`👋 Peer ${signal.fromUserId} joined, creating offer`);
    
    // Create offer for new peer
    const pc = createPeerConnection(signal.fromUserId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(`✅ Created and set local offer for ${signal.fromUserId}`);

      await sendVideoCallSignal({
        groupId,
        fromUserId: firebaseUser!.uid,
        toUserId: signal.fromUserId,
        type: 'offer',
        data: offer,
      });
      console.log(`📤 Sent offer to ${signal.fromUserId}`);
    } catch (error) {
      console.error(`❌ Error creating offer for ${signal.fromUserId}:`, error);
    }
  }, [createPeerConnection, firebaseUser, groupId]);

  // Handle peer leave with enhanced logging
  const handlePeerLeave = useCallback((signal: VideoCallSignal) => {
    console.log(`👋 Peer ${signal.fromUserId} left`);
    
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(signal.fromUserId);
    }

    // Clean up pending candidates and timeouts
    pendingCandidates.current.delete(signal.fromUserId);
    clearConnectionTimeout(signal.fromUserId);
    connectionAttempts.current.delete(signal.fromUserId);

    setState(prev => {
      const newRemoteStreams = new Map(prev.remoteStreams);
      newRemoteStreams.delete(signal.fromUserId);
      const newConnectionStatus = new Map(prev.connectionStatus);
      newConnectionStatus.delete(signal.fromUserId);
      return { 
        ...prev, 
        remoteStreams: newRemoteStreams,
        connectionStatus: newConnectionStatus
      };
    });
  }, [clearConnectionTimeout]);

  // End call with enhanced cleanup
  const endCall = useCallback(async () => {
    if (!firebaseUser) return;

    console.log('🔚 Ending video call...');

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    // Close peer connections and clear timeouts
    peerConnections.current.forEach((pc, peerId) => {
      console.log(`🔌 Closing peer connection with ${peerId}`);
      pc.close();
      clearConnectionTimeout(peerId);
    });
    peerConnections.current.clear();

    // Clean up pending candidates and attempts
    pendingCandidates.current.clear();
    connectionAttempts.current.clear();

    // Leave video call
    await leaveVideoCall(groupId, firebaseUser.uid);

    // (Removed: auto-cleanup if no participants left)
    // Only clean up call when user explicitly ends it

    // Unsubscribe
    if (unsubscribeSignals.current) {
      unsubscribeSignals.current();
      unsubscribeSignals.current = null;
    }
    if (unsubscribeVideoCall.current) {
      unsubscribeVideoCall.current();
      unsubscribeVideoCall.current = null;
    }

    setState({
      isInCall: false,
      isConnecting: false,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoOff: false,
      error: null,
      connectionStatus: new Map(),
      connectionTimeouts: new Map(),
    });
  }, [groupId, firebaseUser, clearConnectionTimeout]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
        console.log(`🔇 Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
        console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
} 