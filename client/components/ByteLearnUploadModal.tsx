import { useState } from "react";
import { X, Upload, Video, Tag, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";

interface ByteLearnUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (reelData: any) => void;
}

const subjects = [
  "Science", "Math", "Tech", "Language", "Fun", "History", 
  "Geography", "Literature", "Art", "Music", "Other"
];

export function ByteLearnUploadModal({ isOpen, onClose, onUpload }: ByteLearnUploadModalProps) {
  const { user, firebaseUser } = useAuthUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    tags: "",
    price: 0,
    videoFile: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser) {
      toast({ title: "Authentication required", description: "Please sign in to upload.", variant: "destructive" });
      return;
    }

    if (!formData.videoFile) {
      toast({ title: "Video required", description: "Please select a video file.", variant: "destructive" });
      return;
    }

    if (!formData.title.trim()) {
      toast({ title: "Title required", description: "Please enter a title for your reel.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual video upload to Firebase Storage
      const reelData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        creator: {
          username: user?.name || firebaseUser.email || "Anonymous",
          profilePic: user?.avatarUrl || firebaseUser.photoURL || "",
        },
        timestamp: Date.now(),
        likes: 0,
        comments: 0,
        saves: 0,
        views: 0,
        duration: 0, // TODO: Get actual video duration
      };

      await onUpload(reelData);
      setFormData({
        title: "",
        description: "",
        subject: "",
        tags: "",
        price: 0,
        videoFile: null,
      });
      onClose();
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({ title: "File too large", description: "Please select a video under 100MB.", variant: "destructive" });
        return;
      }
      setFormData(prev => ({ ...prev, videoFile: file }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Upload ByteLearn Reel</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Video Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Video File</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {formData.videoFile ? formData.videoFile.name : "Click to upload video"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, MOV, AVI up to 100MB
                  </p>
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a catchy title..."
                className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your educational content..."
                rows={3}
                className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas..."
                className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Price (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  placeholder="0 for free"
                  min="0"
                  className="w-full pl-10 pr-3 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isUploading || !formData.videoFile || !formData.title.trim()}
              className="w-full flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Reel
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 