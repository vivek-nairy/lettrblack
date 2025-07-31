import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, Plus, Trophy, Bookmark, Share, Play, Pause } from "lucide-react";
import { useAuthUser } from "../hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";
import { addXpToUser } from "../lib/firestore-utils";
import { cn } from "@/lib/utils";
import { fetchByteLearnVideos, updateVideoLikes, updateVideoViews, updateVideoComments, ByteLearnVideo } from "../lib/bytelearn-utils";

// Sample data matching Firebase schema

// Sample data matching Firebase schema
const sampleVideos: ByteLearnVideo[] = [
  {
    videoId: "video1",
    subject: "Science",
    grade: "8",
    title: "Photosynthesis in 60 Seconds",
    videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    xpReward: 10,
    description: "Learn how plants convert sunlight into energy",
    duration: 60,
    likes: 156,
    comments: 23,
    views: 8920,
    creator: {
      name: "Dr. Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    }
  },
  {
    videoId: "video2",
    subject: "Math",
    grade: "9",
    title: "Pythagoras Theorem Made Simple",
    videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    xpReward: 15,
    description: "Master the Pythagorean theorem in under a minute",
    duration: 45,
    likes: 234,
    comments: 45,
    views: 15420,
    creator: {
      name: "Prof. Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    }
  },
  {
    videoId: "video3",
    subject: "Tech",
    grade: "10",
    title: "JavaScript Arrays Explained",
    videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    xpReward: 20,
    description: "Quick guide to JavaScript array methods",
    duration: 50,
    likes: 342,
    comments: 78,
    views: 23450,
    creator: {
      name: "Code Master Alex",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    }
  },
  {
    videoId: "video4",
    subject: "Language",
    grade: "7",
    title: "English Grammar: Past Perfect Tense",
    videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    xpReward: 12,
    description: "Master the past perfect tense in 60 seconds",
    duration: 60,
    likes: 89,
    comments: 12,
    views: 5670,
    creator: {
      name: "Ms. Emily Wilson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    }
  }
];

interface ReelCardProps {
  video: ByteLearnVideo;
  isActive: boolean;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onSave: (videoId: string) => void;
  onShare: (video: ByteLearnVideo) => void;
  onEarnXP: (videoId: string, xpReward: number) => void;
  onTakeQuiz: (videoId: string) => void;
  onView: (videoId: string) => void;
  isLiked: boolean;
  isSaved: boolean;
  hasEarnedXP: boolean;
}

function ReelCard({
  video,
  isActive,
  onLike,
  onComment,
  onSave,
  onShare,
  onEarnXP,
  onTakeQuiz,
  onView,
  isLiked,
  isSaved,
  hasEarnedXP
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
        // Track video view when it becomes active
        onView(video.videoId);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, video.videoId, onView]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="h-screen w-full flex-shrink-0 snap-start relative bg-black">
      {/* Video Player */}
      <video
        ref={videoRef}
        src={video.videoURL}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        onClick={handleVideoClick}
      />
      
      {/* Video Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* Video Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <img 
                src={video.creator?.avatar || video.thumbnail} 
                alt="Creator"
                className="w-10 h-10 rounded-full border-2 border-white/20"
              />
              <div>
                <p className="font-semibold text-lg">{video.title}</p>
                <p className="text-sm opacity-80">{video.creator?.name}</p>
              </div>
            </div>
          </div>
          
          {/* Subject and Grade Badges */}
          <div className="flex gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-500/80 rounded-full text-sm font-medium">
              {video.subject}
            </span>
            <span className="px-3 py-1 bg-green-500/80 rounded-full text-sm font-medium">
              Grade {video.grade}
            </span>
          </div>
          
          {/* Description */}
          {video.description && (
            <p className="text-sm opacity-90 mb-4 line-clamp-2">
              {video.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4">
        {/* Like Button */}
        <button
          onClick={() => onLike(video.videoId)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
            <Heart 
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked ? "fill-red-500 text-red-500" : ""
              )} 
            />
          </div>
          <span className="text-sm font-medium">
            {video.likes || 0}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => onComment(video.videoId)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">
            {video.comments || 0}
          </span>
        </button>

        {/* XP Earn Button */}
        <button
          onClick={() => onEarnXP(video.videoId, video.xpReward)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors",
            hasEarnedXP 
              ? "bg-green-500/80 hover:bg-green-500/90" 
              : "bg-yellow-500/80 hover:bg-yellow-500/90"
          )}>
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">
            {hasEarnedXP ? "Earned" : `+${video.xpReward} XP`}
          </span>
        </button>

        {/* Save Button */}
        <button
          onClick={() => onSave(video.videoId)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
            <Bookmark 
              className={cn(
                "w-6 h-6 transition-colors",
                isSaved ? "fill-yellow-400 text-yellow-400" : ""
              )} 
            />
          </div>
          <span className="text-sm font-medium">Save</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => onShare(video)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
            <Share className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Take Quiz Button */}
      <div className="absolute bottom-6 left-6">
        <button
          onClick={() => onTakeQuiz(video.videoId)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Take Quiz
        </button>
      </div>

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ByteLearnPage() {
  const { user, firebaseUser } = useAuthUser();
  const { toast } = useToast();
  const [videos, setVideos] = useState<ByteLearnVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [earnedXP, setEarnedXP] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load videos from Firebase
    const loadVideos = async () => {
      try {
        // Try to fetch from Firebase first, fallback to sample data
        const firebaseVideos = await fetchByteLearnVideos();
        if (firebaseVideos.length > 0) {
          setVideos(firebaseVideos);
        } else {
          // Fallback to sample data if no Firebase videos
          setVideos(sampleVideos);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading videos:", error);
        // Fallback to sample data on error
        setVideos(sampleVideos);
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  const handleLike = async (videoId: string) => {
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
        // Add XP for liking
        if (firebaseUser) {
          addXpToUser(firebaseUser.uid, 1, 'like_video', 5);
        }
      }
      return newSet;
    });

    // Update Firebase likes count
    try {
      await updateVideoLikes(videoId, 1);
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleComment = async (videoId: string) => {
    toast({ title: "Comments coming soon!", description: "Comment feature will be available in the next update." });
    
    // Update Firebase comments count
    try {
      await updateVideoComments(videoId, 1);
    } catch (error) {
      console.error("Error updating comments:", error);
    }
  };

  const handleSave = (videoId: string) => {
    setSavedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
        // Add XP for saving
        if (firebaseUser) {
          addXpToUser(firebaseUser.uid, 2, 'save_video', 10);
        }
      }
      return newSet;
    });
  };

  const handleShare = (video: ByteLearnVideo) => {
    navigator.share?.({
      title: video.title,
      text: `Check out this ByteLearn video: ${video.title}`,
      url: window.location.href
    }).catch(() => {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${video.title} - ${window.location.href}`);
      toast({ title: "Link copied!", description: "Video link copied to clipboard." });
    });
  };

  const handleEarnXP = async (videoId: string, xpReward: number) => {
    if (earnedXP.has(videoId)) {
      toast({ title: "XP already earned!", description: "You've already earned XP for this video." });
      return;
    }

    if (!firebaseUser) {
      toast({ title: "Authentication required", description: "Please sign in to earn XP.", variant: "destructive" });
      return;
    }

    try {
      await addXpToUser(firebaseUser.uid, xpReward, 'watch_video', xpReward * 2);
      setEarnedXP(prev => new Set([...prev, videoId]));
      toast({ 
        title: `+${xpReward} XP Earned!`, 
        description: `Great job! You earned ${xpReward} XP for watching this video.` 
      });
    } catch (error) {
      toast({ title: "Error earning XP", description: error.message, variant: "destructive" });
    }
  };

  const handleTakeQuiz = (videoId: string) => {
    toast({ title: "Quiz feature coming soon!", description: "Interactive quizzes will be available in the next update." });
  };

  // Track video views when they become visible
  const handleVideoView = async (videoId: string) => {
    try {
      await updateVideoViews(videoId);
    } catch (error) {
      console.error("Error updating video views:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden">
      {/* Full-screen video container with snap scrolling */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
      >
        {videos.map((video, index) => (
                      <ReelCard
              key={video.videoId}
              video={video}
              isActive={true} // All videos are active in this immersive view
              onLike={handleLike}
              onComment={handleComment}
              onSave={handleSave}
              onShare={handleShare}
              onEarnXP={handleEarnXP}
              onTakeQuiz={handleTakeQuiz}
              onView={handleVideoView}
              isLiked={likedVideos.has(video.videoId)}
              isSaved={savedVideos.has(video.videoId)}
              hasEarnedXP={earnedXP.has(video.videoId)}
            />
        ))}
      </div>
    </div>
  );
} 