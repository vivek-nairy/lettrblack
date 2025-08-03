import { useRef, useEffect } from "react";
import { Heart, MessageCircle, Share, Bookmark, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

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
  const isMobile = useIsMobile();

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
    <div className={cn(
      "relative bg-black",
      "h-full w-full video-container-mobile" // Force 9:16 on ALL devices
    )}>
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className={cn(
          "w-full h-full object-cover video-player-mobile", // Force 9:16 on ALL devices
          "aspect-ratio-9-16" // Custom class for 9:16
        )}
        loop
        muted
        playsInline
        onClick={() => onVideoClick(reel.id)}
      />
      
      {/* Exit Button - Top Left */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70",
          isMobile ? "p-2 h-8 w-8" : "p-2 h-10 w-10"
        )}
        onClick={() => window.history.back()}
      >
        <ArrowLeft className={cn(
          isMobile ? "w-4 h-4" : "w-5 h-5"
        )} />
      </Button>
      
      {/* Video overlay - adjusted for mobile */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent",
        isMobile ? "from-black/60 via-transparent to-transparent" : ""
      )} />
      
      {/* Video info - mobile optimized */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 text-white",
        isMobile ? "p-4 video-controls-mobile" : "p-6"
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className={cn(
              "font-semibold mb-2",
              isMobile ? "text-base" : "text-lg"
            )}>
              {reel.title}
            </h3>
            <div className={cn(
              "flex items-center gap-3 mb-3",
              isMobile ? "gap-2" : "gap-3"
            )}>
              <div className="flex items-center gap-2">
                <img 
                  src={reel.creator.profilePic} 
                  alt="Creator"
                  className={cn(
                    "rounded-full",
                    isMobile ? "w-6 h-6" : "w-8 h-8"
                  )}
                />
                <span className={cn(
                  "font-medium",
                  isMobile ? "text-sm" : ""
                )}>
                  {reel.creator.username}
                </span>
              </div>
              <span className={cn(
                "opacity-80",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {formatTimeAgo(reel.timestamp)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {reel.tags.map((tag) => (
                <span key={tag} className={cn(
                  "bg-white/20 px-2 py-1 rounded-full",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons - mobile optimized positioning */}
      <div className={cn(
        "absolute flex flex-col gap-4 text-white video-controls-mobile",
        isMobile 
          ? "right-3 bottom-24 gap-3" // Mobile: closer to edge, more spacing
          : "right-4 bottom-20 gap-4" // Desktop: original positioning
      )}>
        <button
          onClick={() => onLike(reel.id)}
          className={cn(
            "flex flex-col items-center gap-1 text-white",
            isMobile ? "mobile-touch-target" : ""
          )}
        >
          <div className={cn(
            "bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm",
            isMobile ? "w-10 h-10" : "w-12 h-12"
          )}>
            <Heart 
              className={cn(
                "transition-colors",
                isMobile ? "w-5 h-5" : "w-6 h-6",
                isLiked ? "fill-red-500 text-red-500" : ""
              )} 
            />
          </div>
          <span className={cn(
            "font-medium",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {reel.likes}
          </span>
        </button>

        <button className={cn(
          "flex flex-col items-center gap-1 text-white",
          isMobile ? "mobile-touch-target" : ""
        )}>
          <div className={cn(
            "bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm",
            isMobile ? "w-10 h-10" : "w-12 h-12"
          )}>
            <MessageCircle className={cn(
              isMobile ? "w-5 h-5" : "w-6 h-6"
            )} />
          </div>
          <span className={cn(
            "font-medium",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {reel.comments}
          </span>
        </button>

        <button
          onClick={() => onShare(reel)}
          className={cn(
            "flex flex-col items-center gap-1 text-white",
            isMobile ? "mobile-touch-target" : ""
          )}
        >
          <div className={cn(
            "bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm",
            isMobile ? "w-10 h-10" : "w-12 h-12"
          )}>
            <Share className={cn(
              isMobile ? "w-5 h-5" : "w-6 h-6"
            )} />
          </div>
          <span className={cn(
            "font-medium",
            isMobile ? "text-xs" : "text-sm"
          )}>
            Share
          </span>
        </button>

        <button
          onClick={() => onSave(reel.id)}
          className={cn(
            "flex flex-col items-center gap-1 text-white",
            isMobile ? "mobile-touch-target" : ""
          )}
        >
          <div className={cn(
            "bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm",
            isMobile ? "w-10 h-10" : "w-12 h-12"
          )}>
            <Bookmark 
              className={cn(
                "transition-colors",
                isMobile ? "w-5 h-5" : "w-6 h-6",
                isSaved ? "fill-yellow-400 text-yellow-400" : ""
              )} 
            />
          </div>
          <span className={cn(
            "font-medium",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {reel.saves}
          </span>
        </button>
      </div>

      {/* Navigation arrows - mobile optimized */}
      <div className={cn(
        "absolute left-4 top-1/2 transform -translate-y-1/2 video-controls-mobile",
        isMobile ? "left-2" : "left-4"
      )}>
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className={cn(
            "bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white transition-opacity",
            isMobile ? "w-8 h-8 mobile-touch-target" : "w-10 h-10",
            !canGoPrev ? "opacity-50" : "hover:bg-white/30"
          )}
        >
          <ChevronUp className={cn(
            isMobile ? "w-4 h-4" : "w-5 h-5"
          )} />
        </button>
      </div>

      <div className={cn(
        "absolute right-4 top-1/2 transform -translate-y-1/2 video-controls-mobile",
        isMobile ? "right-2" : "right-4"
      )}>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            "bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white transition-opacity",
            isMobile ? "w-8 h-8 mobile-touch-target" : "w-10 h-10",
            !canGoNext ? "opacity-50" : "hover:bg-white/30"
          )}
        >
          <ChevronDown className={cn(
            isMobile ? "w-4 h-4" : "w-5 h-5"
          )} />
        </button>
      </div>
    </div>
  );
} 