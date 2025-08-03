import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (videoData: any) => void;
}

export function VideoUploadModal({ isOpen, onClose, onUpload }: VideoUploadModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aspectRatioError, setAspectRatioError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateVideoAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const aspectRatio = video.videoWidth / video.videoHeight;
        const targetRatio = 9/16; // 9:16 aspect ratio
        const tolerance = 0.1; // Allow some tolerance
        
        const isValid = Math.abs(aspectRatio - targetRatio) <= tolerance;
        
        if (!isValid) {
          setAspectRatioError(`Video must be in 9:16 aspect ratio. Current ratio: ${aspectRatio.toFixed(2)}:1`);
        } else {
          setAspectRatioError("");
        }
        
        resolve(isValid);
      };
      
      video.onerror = () => {
        setAspectRatioError("Invalid video file");
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast({ 
        title: "Invalid file type", 
        description: "Please select a video file.", 
        variant: "destructive" 
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Video must be smaller than 50MB.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate aspect ratio
    const isValidAspectRatio = await validateVideoAspectRatio(file);
    if (!isValidAspectRatio) {
      toast({ 
        title: "Invalid aspect ratio", 
        description: "Video must be in 9:16 (portrait) format.", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast({ 
        title: "Missing information", 
        description: "Please provide a title and select a video.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const videoData = {
        title,
        description,
        tags,
        file: selectedFile,
        duration: 0, // Would be calculated from video metadata
        timestamp: Date.now()
      };

      onUpload(videoData);
      
      toast({ 
        title: "Upload successful!", 
        description: "Your video has been uploaded successfully." 
      });
      
      handleClose();
    } catch (error) {
      toast({ 
        title: "Upload failed", 
        description: "There was an error uploading your video.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setNewTag("");
    setSelectedFile(null);
    setAspectRatioError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload ByteLearn Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File (9:16 aspect ratio required)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                id="video-file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Video File
              </Button>
              {selectedFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {selectedFile.name}
                </div>
              )}
              {aspectRatioError && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {aspectRatioError}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || isUploading || !!aspectRatioError}
              className="flex-1"
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 