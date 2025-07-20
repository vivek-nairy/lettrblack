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
}

export function useVideoCall(groupId: string) {
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
  });

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoCallRef = useRef<VideoCall | null>(null);
  const unsubscribeSignals = useRef<(() => void) | null>(null);
  const unsubscribeVideoCall = useRef<(() => void) | null>(null);

  // Initialize WebRTC peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
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

    // Handle remote stream
    pc.ontrack = (event) => {
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams);
        newRemoteStreams.set(peerId, event.streams[0]);
        return { ...prev, remoteStreams: newRemoteStreams };
      });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [groupId, firebaseUser]);

  // Start video call
  const startCall = useCallback(async () => {
    if (!firebaseUser) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));

      // Check if call already exists
      let videoCall = await getVideoCall(groupId);
      
      if (!videoCall) {
        // Create new call
        const roomId = crypto.randomUUID();
        videoCall = await createVideoCall(groupId, roomId);
      }

      videoCallRef.current = videoCall;

      // Join the call
      await joinVideoCall(groupId, firebaseUser.uid, firebaseUser.displayName || 'Anonymous');

      // Subscribe to video call updates
      unsubscribeVideoCall.current = subscribeToVideoCall(groupId, (updatedVideoCall) => {
        if (updatedVideoCall) {
          videoCallRef.current = updatedVideoCall;
          setState(prev => ({ ...prev, participants: updatedVideoCall.participants }));
        }
      });

      // Subscribe to signaling
      unsubscribeSignals.current = subscribeToVideoCallSignals(groupId, (signals) => {
        handleSignals(signals);
      });

      setState(prev => ({ 
        ...prev, 
        isInCall: true, 
        isConnecting: false,
        participants: videoCall?.participants || []
      }));

    } catch (error) {
      console.error('Error starting call:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to start call'
      }));
    }
  }, [groupId, firebaseUser, createPeerConnection]);

  // Handle incoming signals
  const handleSignals = useCallback(async (signals: VideoCallSignal[]) => {
    if (!firebaseUser) return;

    for (const signal of signals) {
      // Skip our own signals
      if (signal.fromUserId === firebaseUser.uid) continue;

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

  // Handle incoming offer
  const handleOffer = useCallback(async (signal: VideoCallSignal) => {
    const pc = createPeerConnection(signal.fromUserId);
    
    await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await sendVideoCallSignal({
      groupId,
      fromUserId: firebaseUser!.uid,
      toUserId: signal.fromUserId,
      type: 'answer',
      data: answer,
    });
  }, [createPeerConnection, firebaseUser]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (signal: VideoCallSignal) => {
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (signal: VideoCallSignal) => {
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.data));
    }
  }, []);

  // Handle peer join
  const handlePeerJoin = useCallback(async (signal: VideoCallSignal) => {
    if (signal.fromUserId === firebaseUser!.uid) return;

    // Create offer for new peer
    const pc = createPeerConnection(signal.fromUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await sendVideoCallSignal({
      groupId,
      fromUserId: firebaseUser!.uid,
      toUserId: signal.fromUserId,
      type: 'offer',
      data: offer,
    });
  }, [createPeerConnection, firebaseUser]);

  // Handle peer leave
  const handlePeerLeave = useCallback((signal: VideoCallSignal) => {
    const pc = peerConnections.current.get(signal.fromUserId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(signal.fromUserId);
    }

    setState(prev => {
      const newRemoteStreams = new Map(prev.remoteStreams);
      newRemoteStreams.delete(signal.fromUserId);
      return { ...prev, remoteStreams: newRemoteStreams };
    });
  }, []);

  // End call
  const endCall = useCallback(async () => {
    if (!firebaseUser) return;

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Leave video call
    await leaveVideoCall(groupId, firebaseUser.uid);

    // Cleanup if no participants left
    const videoCall = await getVideoCall(groupId);
    if (videoCall && videoCall.participants.filter(p => p.isConnected).length === 0) {
      await cleanupVideoCall(groupId);
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
    });
  }, [groupId, firebaseUser]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
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