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
  });

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoCallRef = useRef<VideoCall | null>(null);
  const unsubscribeSignals = useRef<(() => void) | null>(null);
  const unsubscribeVideoCall = useRef<(() => void) | null>(null);
  const pendingCandidates = useRef<Map<string, RTCIceCandidate[]>>(new Map());

  // Initialize WebRTC peer connection with enhanced logging
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    console.log(`Creating peer connection for ${peerId}`);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
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
      console.log(`Received remote stream from ${peerId}:`, event.streams[0]);
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

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [groupId, firebaseUser]);

  // Start video call
  const startCall = useCallback(async () => {
    if (!firebaseUser) return;

    console.log('Starting video call...');
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('Media stream obtained:', stream.getTracks().map(t => t.kind));
      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));

      // Check if call already exists
      let videoCall = await getVideoCall(groupId);
      
      if (!videoCall) {
        // Create new call
        const roomId = crypto.randomUUID();
        videoCall = await createVideoCall(groupId, roomId);
        console.log('Created new video call:', roomId);
        
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
        console.log('Joining existing video call');
      }

      videoCallRef.current = videoCall;

      // Join the call
      await joinVideoCall(groupId, firebaseUser.uid, firebaseUser.displayName || 'Anonymous');

      // Subscribe to video call updates
      unsubscribeVideoCall.current = subscribeToVideoCall(groupId, (updatedVideoCall) => {
        if (updatedVideoCall) {
          console.log('Video call updated:', updatedVideoCall.participants);
          videoCallRef.current = updatedVideoCall;
          setState(prev => ({ ...prev, participants: updatedVideoCall.participants }));
        }
      });

      // Subscribe to signaling
      unsubscribeSignals.current = subscribeToVideoCallSignals(groupId, (signals) => {
        console.log('Received signals:', signals);
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
      console.error('Error starting call:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to start call'
      }));
    }
  }, [groupId, firebaseUser, createPeerConnection, groupName]);

  // Handle incoming signals with enhanced logging
  const handleSignals = useCallback(async (signals: VideoCallSignal[]) => {
    if (!firebaseUser) return;

    for (const signal of signals) {
      // Skip our own signals
      if (signal.fromUserId === firebaseUser.uid) continue;

      console.log(`Processing signal from ${signal.fromUserId}:`, signal.type);

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
        console.error('Error handling signal:', error);
      }
    }
  }, [firebaseUser]);

  // Handle incoming offer with enhanced logging
  const handleOffer = useCallback(async (signal: VideoCallSignal) => {
    console.log(`Handling offer from ${signal.fromUserId}`);
    
    const pc = createPeerConnection(signal.fromUserId);
    
    // Set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
    console.log(`Set remote description for ${signal.fromUserId}`);
    
    // Create and set local answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log(`Created and set local answer for ${signal.fromUserId}`);

    // Send answer
    await sendVideoCallSignal({
      groupId,
      fromUserId: firebaseUser!.uid,
      toUserId: signal.fromUserId,
      type: 'answer',
      data: answer,
    });
    console.log(`Sent answer to ${signal.fromUserId}`);

    // Add any pending ICE candidates
    const pending = pendingCandidates.current.get(signal.fromUserId) || [];
    for (const candidate of pending) {
      await pc.addIceCandidate(candidate);
      console.log(`Added pending ICE candidate for ${signal.fromUserId}`);
    }
    pendingCandidates.current.delete(signal.fromUserId);
  }, [createPeerConnection, firebaseUser, groupId]);

  // Handle incoming answer with enhanced logging
  const handleAnswer = useCallback(async (signal: VideoCallSignal) => {
    console.log(`Handling answer from ${signal.fromUserId}`);
    
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      console.log(`Set remote description (answer) for ${signal.fromUserId}`);
      
      // Add any pending ICE candidates
      const pending = pendingCandidates.current.get(signal.fromUserId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(candidate);
        console.log(`Added pending ICE candidate for ${signal.fromUserId}`);
      }
      pendingCandidates.current.delete(signal.fromUserId);
    } else {
      console.warn(`No peer connection found for ${signal.fromUserId}`);
    }
  }, []);

  // Handle ICE candidate with enhanced logging
  const handleIceCandidate = useCallback(async (signal: VideoCallSignal) => {
    console.log(`Handling ICE candidate from ${signal.fromUserId}`);
    
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.data));
        console.log(`Added ICE candidate for ${signal.fromUserId}`);
      } catch (error) {
        console.error(`Error adding ICE candidate for ${signal.fromUserId}:`, error);
      }
    } else {
      // Store candidate for later if peer connection doesn't exist yet
      console.log(`Storing ICE candidate for ${signal.fromUserId} (PC not ready)`);
      const pending = pendingCandidates.current.get(signal.fromUserId) || [];
      pending.push(new RTCIceCandidate(signal.data));
      pendingCandidates.current.set(signal.fromUserId, pending);
    }
  }, []);

  // Handle peer join with enhanced logging
  const handlePeerJoin = useCallback(async (signal: VideoCallSignal) => {
    if (signal.fromUserId === firebaseUser!.uid) return;

    console.log(`Peer ${signal.fromUserId} joined, creating offer`);
    
    // Create offer for new peer
    const pc = createPeerConnection(signal.fromUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log(`Created and set local offer for ${signal.fromUserId}`);

    await sendVideoCallSignal({
      groupId,
      fromUserId: firebaseUser!.uid,
      toUserId: signal.fromUserId,
      type: 'offer',
      data: offer,
    });
    console.log(`Sent offer to ${signal.fromUserId}`);
  }, [createPeerConnection, firebaseUser, groupId]);

  // Handle peer leave with enhanced logging
  const handlePeerLeave = useCallback((signal: VideoCallSignal) => {
    console.log(`Peer ${signal.fromUserId} left`);
    
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(signal.fromUserId);
    }

    // Clean up pending candidates
    pendingCandidates.current.delete(signal.fromUserId);

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
  }, []);

  // End call with enhanced cleanup
  const endCall = useCallback(async () => {
    if (!firebaseUser) return;

    console.log('Ending video call...');

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    // Close peer connections
    peerConnections.current.forEach((pc, peerId) => {
      console.log(`Closing peer connection with ${peerId}`);
      pc.close();
    });
    peerConnections.current.clear();

    // Clean up pending candidates
    pendingCandidates.current.clear();

    // Leave video call
    await leaveVideoCall(groupId, firebaseUser.uid);

    // Cleanup if no participants left
    const videoCall = await getVideoCall(groupId);
    if (videoCall && videoCall.participants.filter(p => p.isConnected).length === 0) {
      await cleanupVideoCall(groupId);
      
      // End call and send notification
      await endCall(groupId);
      if (groupName && firebaseUser) {
        await sendCallEndedNotification(
          groupId,
          firebaseUser.uid,
          firebaseUser.displayName || 'Anonymous',
          groupName
        );
      }
    }

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
    });
  }, [groupId, firebaseUser, groupName]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
        console.log(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
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
        console.log(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
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