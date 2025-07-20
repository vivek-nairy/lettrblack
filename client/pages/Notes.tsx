import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { NoteUploadModal, NoteUploadData } from "@/components/NoteUploadModal";
import { NoteDetailModal } from "@/components/NoteDetailModal";
import { NotesAIChatbot } from "@/components/NotesAIChatbot";
import {
  Search,
  Plus,
  FileText,
  Filter,
  SortDesc,
  Eye,
  Download,
  DollarSign,
  Star,
  Tag,
  Calendar,
  TrendingUp,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  CheckCircle,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getPublicNotes, 
  searchNotes, 
  getNotesBySubject, 
  getNotesByPriceRange,
  incrementNoteViews,
  incrementNoteDownloads,
  purchaseNote,
  getUserPurchases,
  subscribeToPublicNotes,
  createNote
} from "@/lib/firestore-utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Note } from "@/lib/firestore-structure";
import { Button } from "@/components/ui/button";

const subjects = [
  "Physics", "Chemistry", "Biology", "Mathematics", "English", 
  "History", "Geography", "Economics", "Computer Science", "Programming",
  "Java", "Python", "JavaScript", "React", "Node.js", "Psychology",
  "Sociology", "Philosophy", "Literature", "Art", "Music", "Other"
];

const sortOptions = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
  { id: "most-viewed", name: "Most Viewed" },
  { id: "most-downloaded", name: "Most Downloaded" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
  { id: "alphabetical", name: "Alphabetical" },
];

export function Notes() {
  const { user, firebaseUser } = useAuthUser();
  const { toast } = useToast();
  
  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("newest");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notes and user purchases
  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    // Subscribe to public notes
    const unsubscribeNotes = subscribeToPublicNotes((notesData) => {
      setNotes(notesData);
      setLoading(false);
    });

    // Load user purchases
    const loadPurchases = async () => {
      try {
        const purchases = await getUserPurchases(firebaseUser.uid);
        const purchasedNoteIds = purchases.map(p => p.noteId);
        setUserPurchases(purchasedNoteIds);
      } catch (error) {
        console.error("Error loading purchases:", error);
      }
    };

    loadPurchases();

    return () => {
      unsubscribeNotes();
    };
  }, [firebaseUser]);

  // Filter and sort notes
  useEffect(() => {
    let filtered = [...notes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        note.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Subject filter
    if (selectedSubject) {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }

    // Price filter
    filtered = filtered.filter(note => 
      note.price >= priceRange.min && note.price <= priceRange.max
    );

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.createdAt - b.createdAt;
        case "most-viewed":
          return b.views - a.views;
        case "most-downloaded":
          return b.downloads - a.downloads;
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default: // newest
          return b.createdAt - a.createdAt;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchTerm, selectedSubject, priceRange, sortBy]);

  // AI Chatbot handlers
  const handleAISearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleAIFilterBySubject = (subject: string) => {
    setSelectedSubject(subject);
  };

  const handleAIFilterByPrice = (minPrice: number, maxPrice: number) => {
    setPriceRange({ min: minPrice, max: maxPrice });
  };

  // Upload handler
  const handleUpload = async (noteData: NoteUploadData) => {
    if (!firebaseUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload notes.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = "";
      let coverImageUrl = "";

      // Upload main file
      if (noteData.file) {
        const fileName = `${firebaseUser.uid}_${Date.now()}_${noteData.file.name}`;
        const fileRef = ref(storage, `notes/${fileName}`);
        await uploadBytes(fileRef, noteData.file);
        fileUrl = await getDownloadURL(fileRef);
      }

      // Upload cover image
      if (noteData.coverImage) {
        const imageName = `${firebaseUser.uid}_${Date.now()}_cover_${noteData.coverImage.name}`;
        const imageRef = ref(storage, `covers/${imageName}`);
        await uploadBytes(imageRef, noteData.coverImage);
        coverImageUrl = await getDownloadURL(imageRef);
      }

      // Create note object
      const note: Partial<Note> = {
        authorId: firebaseUser.uid,
        authorName: user?.name || firebaseUser.email || "Anonymous",
        type: noteData.file?.name.endsWith('.pdf') ? 'pdf' : 
              noteData.file?.name.endsWith('.docx') ? 'docx' : 
              noteData.file?.name.endsWith('.doc') ? 'doc' : 'text',
        title: noteData.title,
        description: noteData.description,
        subject: noteData.subject,
        tags: noteData.tags,
        price: noteData.price,
        fileUrl: fileUrl,
        coverImageUrl: coverImageUrl,
        content: fileUrl,
        starredBy: [],
        views: 0,
        downloads: 0,
        purchases: [],
        isPublic: noteData.isPublic,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await createNote(note);

      toast({
        title: "Note uploaded successfully!",
        description: noteData.isPublic 
          ? "Your note is now available in the marketplace." 
          : "Your note has been uploaded to your groups.",
      });

      // Don't close modal here - let the modal handle it
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your note. Please try again.",
        variant: "destructive",
      });
      // Re-throw error so modal can handle it
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Purchase handler
  const handlePurchase = async (noteId: string, price: number) => {
    if (!firebaseUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase notes.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      // For MVP, we'll simulate a successful purchase
      // In production, this would integrate with Razorpay/Stripe
      await purchaseNote(noteId, firebaseUser.uid, price);
      
      // Update local state
      setUserPurchases(prev => [...prev, noteId]);
      
      toast({
        title: "Purchase successful!",
        description: "You can now download this note.",
      });

      setShowDetailModal(false);
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Note detail handler
  const handleNoteClick = async (note: Note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
    
    // Increment view count
    try {
      await incrementNoteViews(note.id);
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
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
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Study Notes Marketplace
            </h1>
            <p className="text-muted-foreground">
              Discover and share high-quality study materials
            </p>
          </div>

          <div className="flex items-center gap-3">
            {firebaseUser && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="lettrblack-button flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload Note
              </Button>
            )}
            <Button
              onClick={() => setShowAIChatbot(!showAIChatbot)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes by title, tags, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Price Range:</span>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
            className="w-20 p-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 1000 }))}
            className="w-20 p-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground">₹</span>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => {
              const hasPurchased = userPurchases.includes(note.id);
              const isOwner = firebaseUser?.uid === note.authorId;
              const canDownload = hasPurchased || isOwner || note.price === 0;

              return (
                <div
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  className="lettrblack-card group hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                >
                  {/* Cover Image */}
                  {note.coverImageUrl && (
                    <div className="relative h-48 mb-4">
                      <img
                        src={note.coverImageUrl}
                        alt={note.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-lg" />
                      
                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        {note.price > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/90 text-primary-foreground rounded-full text-sm font-medium">
                            <DollarSign className="w-3 h-3" />
                            ₹{note.price}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white rounded-full text-sm font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Free
                          </span>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        {hasPurchased && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Owned
                          </span>
                        )}
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/90 text-white rounded-full text-xs font-medium">
                            <Star className="w-3 h-3" />
                            Yours
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {getFileTypeIcon(note.type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
                          {note.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {note.subject}
                        </p>
                      </div>
                    </div>

                    {note.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                        {note.description}
                      </p>
                    )}

                    {/* Tags */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{note.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {note.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {note.downloads}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(note.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or upload the first note!
            </p>
          </div>
        )}

        {/* Modals */}
        <NoteUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUpload}
          isUploading={isUploading}
        />

        <NoteDetailModal
          note={selectedNote}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onPurchase={handlePurchase}
          hasPurchased={selectedNote ? userPurchases.includes(selectedNote.id) : false}
          isPurchasing={isPurchasing}
          currentUserId={firebaseUser?.uid}
        />

        {/* AI Chatbot */}
        <NotesAIChatbot
          onSearch={handleAISearch}
          onFilterBySubject={handleAIFilterBySubject}
          onFilterByPrice={handleAIFilterByPrice}
          isOpen={showAIChatbot}
          onToggle={() => setShowAIChatbot(!showAIChatbot)}
        />
      </div>
    </Layout>
  );
}
