import { useRef, useEffect } from "react";
import { Heart, MessageCircle, Share, Bookmark, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelCardProps {
  reel: {
    id: string;
    videoUrl: string;
    title: string;
    subject: string;
    creator: {
      username: string;
      profilePic: string;
    };
    likes: number;
    comments: number;
    saves: number;
    views: number;
    timestamp: number;
    tags: string[];
    duration: number;
  };
  isActive: boolean;
  onLike: (reelId: string) => void;
  onSave: (reelId: string) => void;
  onShare: (reel: any) => void;
  onVideoClick: (reelId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLiked: boolean;
  isSaved: boolean;
}

export function ReelCard({
  reel,
  isActive,
  onLike,
  onSave,
  onShare,
  onVideoClick,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  isLiked,
  isSaved
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="h-full relative bg-black">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        onClick={() => onVideoClick(reel.id)}
      />
      
      {/* Video overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      {/* Video info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {reel.title}
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <img 
                  src={reel.creator.profilePic} 
                  alt="Creator"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">
                  {reel.creator.username}
                </span>
              </div>
              <span className="text-sm opacity-80">
                {formatTimeAgo(reel.timestamp)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {reel.tags.map((tag) => (
                <span key={tag} className="text-sm bg-white/20 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4">
        <button
          onClick={() => onLike(reel.id)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Heart 
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked ? "fill-red-500 text-red-500" : ""
              )} 
            />
          </div>
          <span className="text-sm font-medium">
            {reel.likes}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">
            {reel.comments}
          </span>
        </button>

        <button
          onClick={() => onShare(reel)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Share className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">Share</span>
        </button>

        <button
          onClick={() => onSave(reel.id)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Bookmark 
              className={cn(
                "w-6 h-6 transition-colors",
                isSaved ? "fill-yellow-400 text-yellow-400" : ""
              )} 
            />
          </div>
          <span className="text-sm font-medium">
            {reel.saves}
          </span>
        </button>
      </div>

      {/* Navigation arrows */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className={cn(
            "w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white transition-opacity",
            !canGoPrev ? "opacity-50" : "hover:bg-white/30"
          )}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            "w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white transition-opacity",
            !canGoNext ? "opacity-50" : "hover:bg-white/30"
          )}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 