import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Search,
  DollarSign,
  Eye,
  Download,
  Tag,
  Calendar,
  CheckCircle,
  Star,
  BookOpen,
  Sparkles,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UploadModal } from "@/components/UploadModal";
import { useAuthUser } from "../hooks/useAuthUser";
import { useToast } from "@/hooks/use-toast";
import { addXpToUser } from "../lib/firestore-utils";

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

export default function Marketplace() {
  const { user, firebaseUser } = useAuthUser();
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "notes")).then((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotes(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = [...notes];
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        note.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedSubject) {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }
    filtered = filtered.filter(note => 
      note.price >= priceRange.min && note.price <= priceRange.max
    );
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
        default:
          return b.createdAt - a.createdAt;
      }
    });
    setFilteredNotes(filtered);
  }, [notes, searchTerm, selectedSubject, priceRange, sortBy]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
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

  // Upload handler
  const handleUpload = async (noteData) => {
    if (!firebaseUser) {
      toast({ title: "Authentication required", description: "Please sign in to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      // Simulate upload to Firebase (replace with actual upload logic)
      // You may want to use Firebase Storage for files and Firestore for metadata
      // For now, just add to local state
      const newNote = {
        ...noteData,
        id: Date.now().toString(),
        author: { name: user?.name || firebaseUser.email || "Anonymous" },
        price: noteData.price || 0,
        category: noteData.category || "Notes",
        createdAt: Date.now(),
        views: 0,
        downloads: 0,
      };
      setNotes((prev) => [newNote, ...prev]);
      await addXpToUser(firebaseUser.uid, 5, 'upload_note', 20);
      toast({ title: "Upload successful!", description: "Your content is now in the marketplace." });
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setShowUploadModal(false);
    }
  };

  // Download/Buy handler
  const handleDownloadOrBuy = (note) => {
    if (note.price === 0) {
      // Direct download (simulate)
      toast({ title: "Download started", description: `Downloading ${note.title}` });
      // TODO: Implement actual download logic
    } else {
      // Placeholder payment flow
      toast({ title: "Payment required", description: "Payment flow coming soon!" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              LettrBlack Marketplace
            </h1>
            <p className="text-muted-foreground">
              Buy and sell high-quality study notes, video courses, and more.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {firebaseUser && (
              <Button onClick={() => setShowUploadModal(true)} className="lettrblack-button flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload Content
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <div key={note.id} className="lettrblack-card group hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                <div className="relative h-48 mb-4 flex items-center justify-center bg-muted rounded-t-lg">
                  {/* Thumbnail preview */}
                  {note.coverImageUrl ? (
                    <img src={note.coverImageUrl} alt={note.title} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-muted-foreground" />
                  )}
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
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
                        {note.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {note.subject || note.category}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {note.author?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  {note.description && (
                    <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                      {note.description}
                    </p>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
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
                    <div>
                      <Button size="sm" className="ml-2" onClick={() => handleDownloadOrBuy(note)}>
                        {note.price === 0 ? "Download" : "Buy"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or upload the first item!
            </p>
          </div>
        )}
        <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUpload={handleUpload} />
      </div>
    </Layout>
  );
}
