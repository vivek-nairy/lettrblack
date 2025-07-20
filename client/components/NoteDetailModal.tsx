import { useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  X, 
  Download, 
  Eye, 
  Tag, 
  Calendar, 
  DollarSign,
  Star,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle,
  Lock
} from "lucide-react";
import { cn } from "../lib/utils";
import { Note } from "../lib/firestore-structure";

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (noteId: string, price: number) => Promise<void>;
  hasPurchased: boolean;
  isPurchasing: boolean;
  currentUserId?: string;
}

export function NoteDetailModal({ 
  note, 
  isOpen, 
  onClose, 
  onPurchase, 
  hasPurchased, 
  isPurchasing,
  currentUserId 
}: NoteDetailModalProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen || !note) return null;

  const isOwner = currentUserId === note.authorId;
  const isFree = note.price === 0;
  const canDownload = hasPurchased || isOwner || isFree;

  const handlePurchase = async () => {
    if (isPurchasing) return;
    await onPurchase(note.id, note.price);
  };

  const handleDownload = () => {
    if (!canDownload) return;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = note.fileUrl || note.content;
    link.download = note.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getFileTypeIcon(note.type)}
                <h2 className="text-2xl font-bold text-foreground">{note.title}</h2>
                {note.price > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    <DollarSign className="w-4 h-4" />
                    ₹{note.price}
                  </span>
                )}
                {isFree && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Free
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{note.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover Image */}
              {note.coverImageUrl && (
                <div className="relative">
                  <img
                    src={note.coverImageUrl}
                    alt={note.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                </div>
              )}

              {/* Preview Section */}
              {note.fileUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Preview</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </Button>
                  </div>
                  
                  {showPreview && (
                    <div className="border border-border rounded-lg p-4 bg-muted/20">
                      {note.type === 'pdf' && (
                        <iframe
                          src={note.fileUrl}
                          className="w-full h-96 rounded"
                          title={note.title}
                        />
                      )}
                      {note.type === 'image' && (
                        <img
                          src={note.fileUrl}
                          alt={note.title}
                          className="w-full max-h-96 object-contain rounded"
                        />
                      )}
                      {note.type === 'text' && (
                        <div className="bg-background p-4 rounded border max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{note.content}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {note.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Author Info */}
              <div className="bg-muted/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Author</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {note.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{note.authorName}</p>
                    <p className="text-sm text-muted-foreground">Note Creator</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-muted/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Statistics</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Views</span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      {note.views}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Downloads</span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Download className="w-4 h-4" />
                      {note.downloads}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Purchases</span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      {note.purchases.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {canDownload ? (
                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isFree ? "Download Free" : "Download"}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="w-full"
                    size="lg"
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Buy for ₹{note.price}
                      </>
                    )}
                  </Button>
                )}

                {note.fileUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(note.fileUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in New Tab
                  </Button>
                )}
              </div>

              {/* Purchase Status */}
              {hasPurchased && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Purchased</span>
                  </div>
                  <p className="text-sm text-green-600/80 mt-1">
                    You can download this note anytime
                  </p>
                </div>
              )}

              {isOwner && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Star className="w-5 h-5" />
                    <span className="font-medium">Your Note</span>
                  </div>
                  <p className="text-sm text-blue-600/80 mt-1">
                    You created this note
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 