import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { UploadModal } from "@/components/UploadModal";
import {
  Search,
  Plus,
  FileText,
  Link,
  BookOpen,
  Star,
  MoreVertical,
  Filter,
  SortDesc,
  Eye,
  Download,
  ExternalLink,
  Calendar,
  Tag,
  Folder,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotesByGroup, createNote, updateNote } from "@/lib/firestore-utils";
import { addXpToUser } from "@/lib/firestore-utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useNavigate } from "react-router-dom";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const noteTypeIcons = {
  pdf: FileText,
  link: Link,
  text: BookOpen,
};

const noteTypeColors = {
  pdf: "bg-red-500/10 text-red-400 border-red-500/20",
  link: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  text: "bg-green-500/10 text-green-400 border-green-500/20",
};

const filterOptions = [
  { id: "all", name: "All Types", count: 5 },
  { id: "pdf", name: "PDF Files", count: 2 },
  { id: "link", name: "Links", count: 2 },
  { id: "text", name: "Text Notes", count: 1 },
  { id: "starred", name: "Starred", count: 2 },
];

const sortOptions = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
  { id: "most-viewed", name: "Most Viewed" },
  { id: "most-starred", name: "Most Starred" },
  { id: "alphabetical", name: "Alphabetical" },
];

export function Notes() {
  const { user, firebaseUser } = useAuthUser();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [groupId, setGroupId] = useState(""); // You might want to get this from URL params or context
  const { toast } = useToast();

  // Real-time notes listener
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, "notes"),
      where("authorId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setNotes(notesData);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const filteredAndSortedNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        ) ||
        note.author.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === "all" ||
        note.type === selectedFilter ||
        (selectedFilter === "starred" && note.starred);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.timestamp.getTime() - b.timestamp.getTime();
        case "most-viewed":
          return b.views - a.views;
        case "most-starred":
          return Number(b.starred) - Number(a.starred);
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default: // newest
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const handleUpload = async (newNote) => {
    if (!firebaseUser) return;
    if (newNote.type !== "pdf") {
      toast({ title: "Only PDF files are allowed." });
      return;
    }
    if (!newNote.file) {
      toast({ title: "Please select a PDF file." });
      return;
    }
    if (newNote.file.size > 10 * 1024 * 1024) {
      toast({ title: "File size must be under 10MB." });
      return;
    }
    setUploading(true);
    let fileUrl = "";
    let fileName = "";
    try {
      console.log("Starting file upload...");
      fileName = `${firebaseUser.uid}_${Date.now()}_${newNote.file.name}`;
      const fileRef = ref(storage, `notes/${fileName}`);
      console.log("Uploading to Firebase Storage...");
      await uploadBytes(fileRef, newNote.file);
      console.log("Getting download URL...");
      fileUrl = await getDownloadURL(fileRef);
      console.log("File uploaded successfully:", fileUrl);

      const note = {
        id: crypto.randomUUID(),
        groupId,
        authorId: firebaseUser.uid,
        type: "pdf" as const,
        content: fileUrl, // For PDF, content is the file URL
        title: newNote.title,
        starredBy: [],
        createdAt: Date.now(),
      };

      console.log("Creating note in Firestore...");
      await createNote(note);
      console.log("Note created successfully");

      // Add XP for note upload
      await addXpToUser(firebaseUser.uid, 30, "upload_note", 60);

      toast({
        title: "Note uploaded successfully!",
        description: "Your PDF has been uploaded and is now available.",
      });
      setShowUploadModal(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleStar = async (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !firebaseUser) return;
    const isStarred = note.starredBy.includes(firebaseUser.uid);
    const updatedStarredBy = isStarred
      ? note.starredBy.filter((uid) => uid !== firebaseUser.uid)
      : [...note.starredBy, firebaseUser.uid];
    await updateNote(noteId, { starredBy: updatedStarredBy });
    getNotesByGroup(groupId).then(setNotes);
  };

  const handleNoteAction = (note: any, action: string) => {
    switch (action) {
      case "view":
        // Increment view count
        setNotes(
          notes.map((n) =>
            n.id === note.id ? { ...n, views: n.views + 1 } : n,
          ),
        );
        // Handle different note types
        if (note.type === "link") {
          window.open(note.url, "_blank");
        } else if (note.type === "pdf") {
          console.log("Open PDF:", note.file.name);
        } else {
          console.log("Open text note:", note.title);
        }
        break;
      case "download":
        if (note.type === "pdf") {
          console.log("Download PDF:", note.file.name);
        }
        break;
    }
  };

  return (
    <Layout>
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Loading overlay */}
        {uploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl border border-primary">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              <div className="text-primary font-semibold">Uploading note...</div>
            </div>
          </div>
        )}
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 flex-shrink-0">
            <div className="lettrblack-card h-full p-6 space-y-6">
              {/* Filters */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Filters</h3>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden p-1 hover:bg-muted rounded"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedFilter(option.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                        selectedFilter === option.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      <span className="font-medium">{option.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Folders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Folders</h3>
                  <button className="p-1 hover:bg-muted rounded">
                    <FolderPlus className="w-4 h-4 text-primary" />
                  </button>
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">General Notes</span>
                  </button>
                  <button className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left">
                    <Folder className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Exam Prep</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Shared Notes
              </h1>
              <p className="text-muted-foreground">
                Collaborate on study materials with your group
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 bg-secondary rounded-lg"
                >
                  <Filter className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="lettrblack-button flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes by title, tags, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground text-lg"
            />
          </div>

          {/* Notes Grid */}
          {filteredAndSortedNotes.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedNotes.map((note) => {
                const IconComponent = noteTypeIcons[note.type];
                return (
                  <div
                    key={note.id}
                    className="lettrblack-card group hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0",
                          noteTypeColors[note.type],
                        )}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground text-lg leading-tight">
                            {note.title}
                          </h3>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(note.id);
                              }}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                note.starred
                                  ? "text-yellow-400 hover:bg-yellow-400/10"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                            >
                              <Star
                                className={cn(
                                  "w-4 h-4",
                                  note.starred && "fill-current",
                                )}
                              />
                            </button>
                            <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {note.description}
                        </p>

                        {/* Tags */}
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {note.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={note.author.avatar}
                                alt={note.author.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="text-sm text-muted-foreground">
                                {note.author.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatTimeAgo(note.timestamp)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              {note.views} views
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {note.type === "pdf" && note.fileUrl && (
                              <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="lettrblack-button text-sm flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                View PDF
                              </a>
                            )}
                            {note.type === "docx" && note.fileUrl && (
                              <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="lettrblack-button text-sm flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                Download DOCX
                              </a>
                            )}
                            {note.type === "text" && note.content && (
                              <div className="bg-muted p-2 rounded text-sm max-w-xs overflow-x-auto">
                                {note.content}
                              </div>
                            )}
                            {note.type === "link" && note.url && (
                              <a href={note.url} target="_blank" rel="noopener noreferrer" className="lettrblack-button text-sm flex items-center gap-1">
                                <ExternalLink className="w-4 h-4" />
                                Open Link
                              </a>
                            )}
                            {note.type === "image" && note.fileUrl && (
                              <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img src={note.fileUrl} alt={note.title} className="w-12 h-12 object-cover rounded" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {searchTerm || selectedFilter !== "all"
                  ? "No notes found"
                  : "No notes yet"}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchTerm || selectedFilter !== "all"
                  ? "Try adjusting your search or filters to find the notes you're looking for."
                  : "Upload your first resource to help your group! Share PDFs, links, or create text notes."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </Layout>
  );
}
