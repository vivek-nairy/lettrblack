import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Link,
  BookOpen,
  Paperclip,
  Image,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (note: any) => void;
}

const noteTypes = [
  {
    id: "pdf",
    name: "PDF Document",
    icon: FileText,
    description: "Upload a PDF file",
    accept: ".pdf",
  },
  {
    id: "docx",
    name: "Word Document",
    icon: FileText,
    description: "Upload a DOCX file",
    accept: ".docx",
  },
  {
    id: "image",
    name: "Image",
    icon: Image,
    description: "Upload an image (JPEG, PNG)",
    accept: ".jpg,.jpeg,.png",
  },
  {
    id: "link",
    name: "External Link",
    icon: Link,
    description: "Add a web resource",
    accept: "",
  },
  {
    id: "text",
    name: "Text Note",
    icon: BookOpen,
    description: "Write a markdown note",
    accept: "",
  },
];

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [selectedType, setSelectedType] = useState<string>("pdf");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFile(files[0]);
      if (!title) {
        setTitle(files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    const newNote = {
      id: Date.now(),
      title,
      description,
      type: selectedType,
      content: selectedType === "text" ? content : "",
      url: selectedType === "link" ? url : "",
      file: ["pdf", "docx", "image"].includes(selectedType) ? file : null,
      tags,
      author: {
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      },
      timestamp: new Date(),
      starred: false,
      views: 0,
    };

    onUpload(newNote);
    onClose();

    // Reset form
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setTags([]);
    setFile(null);
    setSelectedType("pdf");
  };

  const selectedTypeConfig = noteTypes.find((type) => type.id === selectedType);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Add New Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Note Type Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Note Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {noteTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-colors",
                    selectedType === type.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <type.icon className="w-6 h-6 mb-2" />
                  <div className="font-medium text-sm">{type.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the note..."
              rows={3}
              className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Content based on type */}
          {["pdf", "docx", "image"].includes(selectedType) && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {selectedType === "pdf"
                  ? "PDF File *"
                  : selectedType === "docx"
                  ? "Word File *"
                  : "Image File *"}
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedTypeConfig?.accept}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    {selectedType === "image" ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded mx-auto"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-primary mx-auto" />
                    )}
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-foreground">
                      Drop file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedType === "pdf"
                        ? "Supports PDF files up to 10MB"
                        : selectedType === "docx"
                        ? "Supports DOCX files up to 10MB"
                        : "Supports JPEG/PNG images up to 5MB"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedType === "link" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                URL *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {selectedType === "text" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Content *{" "}
                <span className="text-xs text-muted-foreground">
                  (Markdown supported)
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note content here... You can use markdown formatting."
                rows={8}
                className="w-full p-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none font-mono text-sm"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tags
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add a tag..."
                  className="flex-1 p-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !title ||
              (selectedType === "pdf" && !file) ||
              (selectedType === "link" && !url) ||
              (selectedType === "text" && !content)
            }
            className="lettrblack-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
