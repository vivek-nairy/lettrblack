import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthUser } from "./useAuthUser";
import { sendCallNotification, updateCallStatus, endCall, sendCallEndedNotification } from "@/lib/call-notification-service";
import { getGroup } from "@/lib/firestore-utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

interface VoiceCallState {
  isInCall: boolean;
  isRinging: boolean;
  isMuted: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  error: string | null;
  callerName?: string;
}

export function useVoiceCall(groupId: string, groupName?: string) {
  const { firebaseUser } = useAuthUser();
  const [state, setState] = useState<VoiceCallState>({
    isInCall: false,
    isRinging: false,
    isMuted: false,
    remoteStream: null,
    localStream: null,
    error: null,
    callerName: undefined,
  });
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callDocRef = doc(db, "voiceCalls", groupId);
  const unsubscribeRef = useRef<() => void>();

  // --- Start a call (as caller) ---
  const startCall = useCallback(async () => {
    if (!firebaseUser) return;
    setState((s) => ({ ...s, error: null }));
    try {
      // Get audio only
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = localStream;
      setState((s) => ({ ...s, localStream }));
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // Save offer to Firestore
      await setDoc(callDocRef, {
        offer: { type: offer.type, sdp: offer.sdp },
        callerId: firebaseUser.uid,
        callerName: firebaseUser.displayName || "Anonymous",
        status: "calling",
        createdAt: Date.now(),
      });
      // Notify group
      if (groupName) {
        await sendCallNotification(groupId, firebaseUser.uid, firebaseUser.displayName || "Anonymous", groupName);
      }
      setState((s) => ({ ...s, isInCall: true }));
      // Listen for answer
      unsubscribeRef.current = onSnapshot(callDocRef, (docSnap) => {
        const data = docSnap.data();
        if (data?.answer && pc.signalingState !== "stable") {
          pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        if (data?.status === "ended") {
          endCallCleanup();
        }
      });
      // ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          updateDoc(callDocRef, { callerIce: event.candidate.toJSON() });
        }
      };
      // Remote stream
      pc.ontrack = (event) => {
        setState((s) => ({ ...s, remoteStream: event.streams[0] }));
      };
    } catch (error: any) {
      setState((s) => ({ ...s, error: error.message || "Failed to start call" }));
    }
  }, [firebaseUser, groupId, groupName]);

  // --- Answer a call (as callee) ---
  const answerCall = useCallback(async () => {
    if (!firebaseUser) return;
    setState((s) => ({ ...s, error: null }));
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = localStream;
      setState((s) => ({ ...s, localStream, isRinging: false, isInCall: true }));
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      // Listen for ICE from caller
      unsubscribeRef.current = onSnapshot(callDocRef, (docSnap) => {
        const data = docSnap.data();
        if (data?.callerIce) {
          pc.addIceCandidate(new RTCIceCandidate(data.callerIce));
        }
        if (data?.status === "ended") {
          endCallCleanup();
        }
      });
      // Set remote offer
      const docSnap = await callDocRef.get();
      const data = docSnap.data();
      if (data?.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      }
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(callDocRef, { answer: { type: answer.type, sdp: answer.sdp } });
      // ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          updateDoc(callDocRef, { calleeIce: event.candidate.toJSON() });
        }
      };
      // Remote stream
      pc.ontrack = (event) => {
        setState((s) => ({ ...s, remoteStream: event.streams[0] }));
      };
    } catch (error: any) {
      setState((s) => ({ ...s, error: error.message || "Failed to answer call" }));
    }
  }, [firebaseUser, groupId]);

  // --- Listen for incoming call ---
  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(callDocRef, (docSnap) => {
      const data = docSnap.data();
      if (data && data.status === "calling" && data.callerId !== firebaseUser.uid) {
        setState((s) => ({ ...s, isRinging: true, callerName: data.callerName }));
      }
    });
    return () => unsub();
  }, [firebaseUser, groupId]);

  // --- End call ---
  const endCallCleanup = useCallback(async () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    setState((s) => ({ ...s, isInCall: false, isRinging: false, remoteStream: null, localStream: null }));
    await updateDoc(callDocRef, { status: "ended" });
  }, [callDocRef]);

  const endCallHandler = useCallback(async () => {
    await endCallCleanup();
    if (firebaseUser) {
      await endCall(groupId);
    }
  }, [endCallCleanup, firebaseUser, groupId]);

  // --- Mute/unmute ---
  const toggleMute = useCallback(() => {
    setState((s) => {
      if (s.localStream) {
        s.localStream.getAudioTracks().forEach((track) => (track.enabled = s.isMuted));
      }
      return { ...s, isMuted: !s.isMuted };
    });
  }, []);

  return {
    state,
    startCall,
    answerCall,
    endCall: endCallHandler,
    toggleMute,
  };
} 