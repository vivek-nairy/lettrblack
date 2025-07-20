import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  BookOpen,
  Eye,
  Globe,
  Lock
} from "lucide-react";
import { cn } from "../lib/utils";

interface NoteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: NoteUploadData) => Promise<void>;
  isUploading: boolean;
}

export interface NoteUploadData {
  title: string;
  description: string;
  subject: string;
  tags: string[];
  price: number;
  file: File | null;
  coverImage: File | null;
  isPublic: boolean;
}

const subjects = [
  "Physics", "Chemistry", "Biology", "Mathematics", "English", 
  "History", "Geography", "Economics", "Computer Science", "Programming",
  "Java", "Python", "JavaScript", "React", "Node.js", "Psychology",
  "Sociology", "Philosophy", "Literature", "Art", "Music", "Other"
];

const acceptedFileTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/jpeg",
  "image/png"
];

export function NoteUploadModal({ isOpen, onClose, onSubmit, isUploading }: NoteUploadModalProps) {
  const [formData, setFormData] = useState<NoteUploadData>({
    title: "",
    description: "",
    subject: "",
    tags: [],
    price: 0,
    file: null,
    coverImage: null,
    isPublic: true
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof NoteUploadData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'coverImage') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'file') {
        handleInputChange('file', file);
      } else {
        handleInputChange('coverImage', file);
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.subject) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.file) {
      newErrors.file = "Please select a file to upload";
    }

    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }

    if (formData.file && formData.file.size > 50 * 1024 * 1024) {
      newErrors.file = "File size must be under 50MB";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        title: "",
        description: "",
        subject: "",
        tags: [],
        price: 0,
        file: null,
        coverImage: null,
        isPublic: true
      });
      setTagInput("");
      setErrors({});
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === tagInput) {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Upload Study Note</h2>
              <p className="text-muted-foreground">Share your knowledge with the community</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Note Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a descriptive title for your note"
                disabled={isUploading}
                className={cn(errors.title && "border-destructive")}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this note contains and who it's for..."
                rows={3}
                disabled={isUploading}
              />
            </div>

            {/* Subject and Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  disabled={isUploading}
                  className={cn(
                    "w-full p-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                    errors.subject && "border-destructive"
                  )}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-sm text-destructive mt-1">{errors.subject}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Price (₹)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={isUploading}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Set to 0 for free notes
                </p>
                {errors.price && (
                  <p className="text-sm text-destructive mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags (press Enter)"
                  disabled={isUploading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isUploading || !tagInput.trim()}
                  variant="outline"
                >
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isUploading}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Note File *
              </label>
              <div
                className={cn(
                  "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors",
                  formData.file && "border-primary bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.file ? (
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{formData.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-foreground font-medium">Click to upload file</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOCX, DOC, TXT, JPG, PNG (max 50MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => handleFileSelect(e, 'file')}
                accept={acceptedFileTypes.join(',')}
                className="hidden"
                disabled={isUploading}
              />
              {errors.file && (
                <p className="text-sm text-destructive mt-1">{errors.file}</p>
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cover Image (Optional)
              </label>
              <div
                className={cn(
                  "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors",
                  formData.coverImage && "border-primary bg-primary/5"
                )}
                onClick={() => coverImageInputRef.current?.click()}
              >
                {formData.coverImage ? (
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{formData.coverImage.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(formData.coverImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-foreground font-medium">Click to upload cover image</p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={coverImageInputRef}
                type="file"
                onChange={(e) => handleFileSelect(e, 'coverImage')}
                accept="image/jpeg,image/png"
                className="hidden"
                disabled={isUploading}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Visibility
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.isPublic}
                    onChange={() => handleInputChange('isPublic', true)}
                    disabled={isUploading}
                    className="text-primary"
                  />
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Public (Marketplace)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={!formData.isPublic}
                    onChange={() => handleInputChange('isPublic', false)}
                    disabled={isUploading}
                    className="text-primary"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Private (Groups only)</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 