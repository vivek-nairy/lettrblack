import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Video, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "../hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";
import { addXpToUser } from "../lib/firestore-utils";
import { ReelCard } from "@/components/ReelCard";
import { FilterTabs } from "@/components/FilterTabs";
import { ByteLearnUploadModal } from "@/components/ByteLearnUploadModal";
import { useNavigate } from "react-router-dom";

// Sample data structure for ByteLearn reels
interface ByteLearnReel {
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
  duration: number; // in seconds
}

const filterOptions = [
  { id: "all", name: "All", icon: Sparkles },
  { id: "science", name: "Science", icon: Sparkles },
  { id: "math", name: "Math", icon: Sparkles },
  { id: "tech", name: "Tech", icon: Sparkles },
  { id: "language", name: "Language", icon: Sparkles },
  { id: "fun", name: "Fun", icon: Sparkles },
];

export default function ByteLearn() {
  const { user, firebaseUser } = useAuthUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reels, setReels] = useState<ByteLearnReel[]>([]);
  const [filteredReels, setFilteredReels] = useState<ByteLearnReel[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Sample data for development
  const sampleReels: ByteLearnReel[] = [
    {
      id: "reel1",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      title: "Learn Pythagoras Theorem in 30s",
      subject: "Math",
      creator: {
        username: "@mathmentor",
        profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      likes: 212,
      comments: 45,
      saves: 89,
      views: 15420,
      timestamp: Date.now() - 3600000,
      tags: ["#Math", "#QuickTips", "#Geometry"],
      duration: 30
    },
    {
      id: "reel2",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      title: "Chemistry: Atomic Structure Explained",
      subject: "Science",
      creator: {
        username: "@chempro",
        profilePic: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
      },
      likes: 156,
      comments: 23,
      saves: 67,
      views: 8920,
      timestamp: Date.now() - 7200000,
      tags: ["#Chemistry", "#Atoms", "#Science"],
      duration: 45
    },
    {
      id: "reel3",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      title: "JavaScript Arrays in 60 Seconds",
      subject: "Tech",
      creator: {
        username: "@codewizard",
        profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      likes: 342,
      comments: 78,
      saves: 123,
      views: 23450,
      timestamp: Date.now() - 10800000,
      tags: ["#JavaScript", "#Programming", "#Coding"],
      duration: 60
    }
  ];

  useEffect(() => {
    // Load reels from Firebase (using sample data for now)
    const loadReels = async () => {
      try {
        // TODO: Replace with actual Firebase query
        // const reelsQuery = query(collection(db, "bytelearnReels"), orderBy("timestamp", "desc"), limit(50));
        // const snapshot = await getDocs(reelsQuery);
        // const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ByteLearnReel));
        
        setReels(sampleReels);
        setFilteredReels(sampleReels);
        setLoading(false);
      } catch (error) {
        console.error("Error loading reels:", error);
        setLoading(false);
      }
    };

    loadReels();
  }, []);

  useEffect(() => {
    // Filter reels based on selected filter
    let filtered = [...reels];
    if (selectedFilter !== "all") {
      filtered = filtered.filter(reel => 
        reel.subject.toLowerCase() === selectedFilter ||
        reel.tags.some(tag => tag.toLowerCase().includes(selectedFilter))
      );
    }
    setFilteredReels(filtered);
    setCurrentReelIndex(0);
  }, [reels, selectedFilter]);

  const handleLike = (reelId: string) => {
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
      } else {
        newSet.add(reelId);
        // Add XP for liking
        if (firebaseUser) {
          addXpToUser(firebaseUser.uid, 1, 'like_reel', 5);
        }
      }
      return newSet;
    });
  };

  const handleSave = (reelId: string) => {
    setSavedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
      } else {
        newSet.add(reelId);
        // Add XP for saving
        if (firebaseUser) {
          addXpToUser(firebaseUser.uid, 2, 'save_reel', 10);
        }
      }
      return newSet;
    });
  };

  const handleShare = (reel: ByteLearnReel) => {
    navigator.share?.({
      title: reel.title,
      text: `Check out this ByteLearn video: ${reel.title}`,
      url: window.location.href
    }).catch(() => {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${reel.title} - ${window.location.href}`);
      toast({ title: "Link copied!", description: "Video link copied to clipboard." });
    });
  };

  const handleVideoClick = (reelId: string) => {
    // Video click handled by ReelCard component
  };

  const handleUpload = async (reelData: any) => {
    if (!firebaseUser) {
      toast({ title: "Authentication required", description: "Please sign in to upload.", variant: "destructive" });
      return;
    }

    try {
      // TODO: Implement actual Firebase upload
      const newReel: ByteLearnReel = {
        id: Date.now().toString(),
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder
        title: reelData.title,
        subject: reelData.subject,
        creator: reelData.creator,
        likes: 0,
        comments: 0,
        saves: 0,
        views: 0,
        timestamp: Date.now(),
        tags: reelData.tags,
        duration: reelData.duration || 30,
      };

      setReels(prev => [newReel, ...prev]);
      await addXpToUser(firebaseUser.uid, 10, 'upload_reel', 50);
      toast({ title: "Upload successful!", description: "Your ByteLearn reel is now live!" });
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  };

  const nextReel = () => {
    if (currentReelIndex < filteredReels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    }
  };

  const prevReel = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Header with filters */}
        <div className="flex-shrink-0 bg-card border-b border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">ByteLearn</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <Video className="w-4 h-4" />
              Upload Reel
            </Button>
          </div>
          
          {/* Filter tabs */}
          <FilterTabs 
            filters={filterOptions}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        </div>

        {/* Video container */}
        <div className="flex-1 relative overflow-hidden">
          {filteredReels.length > 0 ? (
            <div className="h-full relative">
              {/* Current reel */}
              <ReelCard
                reel={filteredReels[currentReelIndex]}
                isActive={true}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                onVideoClick={handleVideoClick}
                onNext={nextReel}
                onPrev={prevReel}
                canGoNext={currentReelIndex < filteredReels.length - 1}
                canGoPrev={currentReelIndex > 0}
                isLiked={likedReels.has(filteredReels[currentReelIndex]?.id || '')}
                isSaved={savedReels.has(filteredReels[currentReelIndex]?.id || '')}
              />

              {/* Progress indicator */}
              <div className="absolute top-4 left-4 right-4">
                <div className="flex gap-1">
                  {filteredReels.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        index === currentReelIndex 
                          ? "bg-white" 
                          : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No reels found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or be the first to upload a reel!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ByteLearnUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </Layout>
  );
} 