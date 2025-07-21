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
  cleanupVideoCall,
  addXpToUser
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
  const videoXpAwardedRef = useRef(false);

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
      if (!videoXpAwardedRef.current) {
        await addXpToUser(firebaseUser.uid, 5, 'join_video_call', 5);
        videoXpAwardedRef.current = true;
      }

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
              console.log(`