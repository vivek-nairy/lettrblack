import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users,
  X,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: any[];
  isMuted: boolean;
  isVideoOff: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionStatus: Map<string, string>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function VideoCallModal({
  isOpen,
  onClose,
  localStream,
  remoteStreams,
  participants,
  isMuted,
  isVideoOff,
  isConnecting,
  error,
  connectionStatus,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video streams
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      const videoElement = remoteVideoRefs.current.get(peerId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  if (!isOpen) return null;

  const allParticipants = participants.filter(p => p.isConnected);
  const gridCols = allParticipants.length <= 1 ? 1 : 
                   allParticipants.length <= 4 ? 2 : 
                   allParticipants.length <= 9 ? 3 : 4;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400" />
            <span className="font-semibold">Video Call</span>
          </div>
          {isConnecting && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Connecting...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>{allParticipants.length} participants</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/90 text-white p-3 text-center">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div 
          className={cn(
            "grid gap-4 h-full",
            gridCols === 1 && "grid-cols-1",
            gridCols === 2 && "grid-cols-1 md:grid-cols-2",
            gridCols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            gridCols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {/* Local Video */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera Off</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              You {isMuted && "(Muted)"}
            </div>
          </div>

          {/* Remote Videos */}
          {Array.from(remoteStreams.entries()).map(([peerId, stream]) => {
            const participant = allParticipants.find(p => p.userId === peerId);
            return (
              <div key={peerId} className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(peerId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {participant?.userName || 'Unknown'}
                </div>
              </div>
            );
          })}

          {/* Placeholder for participants without streams */}
          {allParticipants
            .filter(p => !remoteStreams.has(p.userId))
            .map((participant) => {
              const status = connectionStatus.get(participant.userId);
              return (
                <div key={participant.userId} className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-semibold">
                        {participant.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm">{participant.userName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {status === 'connected' ? '✅ Connected' : 
                       status === 'completed' ? '✅ Connected' :
                       status === 'checking' ? '🔄 Connecting...' :
                       status === 'failed' ? '❌ Connection Failed' :
                       status === 'timeout' ? '⏰ Connection Timeout' :
                       '🔄 Connecting...'}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-6 bg-black/50">
        <Button
          onClick={onToggleMute}
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-12 h-12 p-0"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          onClick={onToggleVideo}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-12 h-12 p-0"
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        <Button
          onClick={onEndCall}
          variant="destructive"
          size="lg"
          className="rounded-full w-12 h-12 p-0"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
} 