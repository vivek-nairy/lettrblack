import { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { ArrowLeft, X, Heart, MessageCircle, Share, Bookmark, Play, Pause, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "../hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { VideoUploadModal } from "@/components/VideoUploadModal";

// Sample 9:16 vertical videos for testing
const sampleVideos = [
  {
    id: "1",
    title: "Learn JavaScript in 60 Seconds",
    creator: "@codewizard",
    creatorPic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", // Will be cropped to 9:16
    likes: 234,
    comments: 45,
    shares: 12,
    views: 15420,
    tags: ["#JavaScript", "#Programming", "#Coding"],
    duration: 60
  },
  {
    id: "2",
    title: "Chemistry: Atomic Structure Explained",
    creator: "@chempro",
    creatorPic: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4", // Will be cropped to 9:16
    likes: 156,
    comments: 23,
    shares: 8,
    views: 8920,
    tags: ["#Chemistry", "#Science", "#Atoms"],
    duration: 45
  },
  {
    id: "3",
    title: "Math: Quick Algebra Tips",
    creator: "@mathmentor",
    creatorPic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4", // Will be cropped to 9:16
    likes: 342,
    comments: 78,
    shares: 25,
    views: 23450,
    tags: ["#Math", "#Algebra", "#Education"],
    duration: 90
  }
];

interface Video {
  id: string;
  title: string;
  creator: string;
  creatorPic: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  tags: string[];
  duration: number;
}

export default function ByteLearn() {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>(sampleVideos);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = videos[currentVideoIndex];

  const handleLike = (videoId: string) => {
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleSave = (videoId: string) => {
    setSavedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleShare = (video: Video) => {
    navigator.share?.({
      title: video.title,
      text: `Check out this ByteLearn video: ${video.title}`,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(`${video.title} - ${window.location.href}`);
      toast({ title: "Link copied!", description: "Video link copied to clipboard." });
    });
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setIsPlaying(false);
    }
  };

  const prevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      setIsPlaying(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleExit = () => {
    navigate('/');
  };

  const handleUpload = (videoData: any) => {
    // Simulate adding new video to the list
    const newVideo: Video = {
      id: Date.now().toString(),
      title: videoData.title,
      creator: "@" + (user?.email?.split('@')[0] || "user"),
      creatorPic: user?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      videoUrl: URL.createObjectURL(videoData.file),
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      tags: videoData.tags,
      duration: videoData.duration
    };

    setVideos(prev => [newVideo, ...prev]);
    setCurrentVideoIndex(0);
  };

  return (
    <Layout>
      <div className="h-screen bg-black relative overflow-hidden">
        {/* Navigation Buttons */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
            onClick={handleExit}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Upload Button */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Video Player */}
        <div className="h-full w-full relative">
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            onClick={handleVideoClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Video Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Video Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {currentVideo.title}
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={currentVideo.creatorPic} 
                      alt="Creator"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-medium">
                      {currentVideo.creator}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentVideo.tags.map((tag) => (
                    <span key={tag} className="text-sm bg-white/20 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute right-4 bottom-24 flex flex-col gap-4 text-white">
            <button
              onClick={() => handleLike(currentVideo.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Heart 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    likedVideos.has(currentVideo.id) ? "fill-red-500 text-red-500" : ""
                  )} 
                />
              </div>
              <span className="text-sm font-medium">
                {currentVideo.likes}
              </span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">
                {currentVideo.comments}
              </span>
            </button>

            <button
              onClick={() => handleShare(currentVideo)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Share className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">
                {currentVideo.shares}
              </span>
            </button>

            <button
              onClick={() => handleSave(currentVideo.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bookmark 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    savedVideos.has(currentVideo.id) ? "fill-yellow-400 text-yellow-400" : ""
                  )} 
                />
              </div>
              <span className="text-sm font-medium">
                Save
              </span>
            </button>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <button
              onClick={prevVideo}
              disabled={currentVideoIndex === 0}
              className={cn(
                "w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white transition-opacity",
                currentVideoIndex === 0 ? "opacity-50" : "hover:bg-white/30"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <button
              onClick={nextVideo}
              disabled={currentVideoIndex === videos.length - 1}
              className={cn(
                "w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white transition-opacity",
                currentVideoIndex === videos.length - 1 ? "opacity-50" : "hover:bg-white/30"
              )}
            >
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="absolute top-4 left-4 right-4">
            <div className="flex gap-1">
              {videos.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    index === currentVideoIndex 
                      ? "bg-white" 
                      : "bg-white/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={handleVideoClick}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </Layout>
  );
} 