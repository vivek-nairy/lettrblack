import { useReducer, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Search,
  Filter,
  Plus,
  Users,
  BookOpen,
  Clock,
  Play,
  MoreVertical,
  Trophy,
  Calendar,
  Settings,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGroupsByUser, createGroup, addXpToUser, subscribeToAllGroups, updateGroup } from "@/lib/firestore-utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const categories = ["All", "Programming", "Math", "Language", "Science"];
const sortOptions = [
  "Recent Activity",
  "Most XP",
  "Most Members",
  "Alphabetical",
];

const initialModalState = {
  open: false,
  name: "",
  subject: "",
  description: "",
  image: null,
  imageUrl: "",
  banner: null,
  bannerUrl: "",
  error: "",
  loading: false,
};

function modalReducer(state, action) {
  console.log("[modalReducer] action:", action, "prevState:", state);
  switch (action.type) {
    case "OPEN":
      return { ...initialModalState, open: true };
    case "CLOSE":
      return { ...initialModalState };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

export function Groups() {
  const { user, firebaseUser } = useAuthUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Recent Activity");
  const [showFilters, setShowFilters] = useState(false);
  const [modal, dispatchModal] = useReducer(modalReducer, initialModalState);

  useEffect(() => {
    if (firebaseUser) {
      // Use real-time subscription to get all groups
      const unsubscribe = subscribeToAllGroups((newGroups) => {
        setGroups(newGroups);
      });
      
      return () => unsubscribe();
    }
  }, [firebaseUser]);

  useEffect(() => {
    console.log("[Groups] modal.open:", modal.open);
  }, [modal.open]);

  const handleCreateGroup = async () => {
    console.log("[handleCreateGroup] called");
    dispatchModal({ type: "SET_ERROR", error: "" });
    if (!firebaseUser) {
      dispatchModal({ type: "SET_ERROR", error: "You must be signed in to create a group." });
      return;
    }
    if (!modal.name.trim() || !modal.subject.trim()) {
      dispatchModal({ type: "SET_ERROR", error: "Group name and subject are required." });
      return;
    }
    dispatchModal({ type: "SET_LOADING", loading: true });
    try {
      let groupImageUrl = "";
      if (modal.image) {
        const fileRef = ref(storage, `group-images/${firebaseUser.uid}_${Date.now()}_${modal.image.name}`);
        await uploadBytes(fileRef, modal.image);
        groupImageUrl = await getDownloadURL(fileRef);
      }
      let bannerUrl = "";
      if (modal.banner) {
        const bannerRef = ref(storage, `group-banners/${firebaseUser.uid}_${Date.now()}_${modal.banner.name}`);
        await uploadBytes(bannerRef, modal.banner);
        bannerUrl = await getDownloadURL(bannerRef);
      }
      const newGroup = {
        name: modal.name.trim(),
        subject: modal.subject.trim(),
        description: modal.description.trim(),
        bannerUrl, // Save banner image URL
        groupImageUrl, // Save group image URL
        id: crypto.randomUUID(),
        ownerId: firebaseUser.uid,
        memberIds: [firebaseUser.uid],
        inviteCode: Math.random().toString(36).substring(2, 8),
        createdAt: Date.now(),
        isPrivate: false,
      };
      await createGroup(newGroup);
      await addXpToUser(firebaseUser.uid, 10, "create_group", 10);
      dispatchModal({ type: "CLOSE" });
      // Groups will be updated automatically via real-time subscription
    } catch (err) {
      dispatchModal({ type: "SET_ERROR", error: err?.message || "Failed to create group. Please try again." });
    } finally {
      dispatchModal({ type: "SET_LOADING", loading: false });
    }
  };

  const handleCancel = () => {
    console.log("[handleCancel] called");
    dispatchModal({ type: "CLOSE" });
  };

  const handleOpenModal = () => {
    console.log("[handleOpenModal] called");
    dispatchModal({ type: "OPEN" });
  };

  const filteredGroups = groups
    .filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || group.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Most XP":
          return b.xp - a.xp;
        case "Most Members":
          return b.members - a.members;
        case "Alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return 0; // Recent Activity - would normally sort by timestamp
      }
    });

  const calculateProgress = (current: number, next: number) => {
    return Math.min((current / next) * 100, 100);
  };



  // Add handler to join group
  const handleJoinGroup = async (group: any) => {
    if (!firebaseUser) return;
    
    try {
      const updatedMemberIds = [...(group.memberIds || []), firebaseUser.uid];
      await updateGroup(group.id, { memberIds: updatedMemberIds });
      // Groups will be updated automatically via real-time subscription
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Study Groups
            </h1>
            <p className="text-muted-foreground">
              Discover, join, and collaborate with study communities
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenModal}
              className="lettrblack-button flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 rounded-lg px-4 py-2 font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manage
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="lettrblack-card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search groups by name or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                showFilters
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col lg:flex-row gap-4">
              {/* Categories */}
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-colors",
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="lg:w-48">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Groups Grid */}
        {filteredGroups.length > 0 ? (
          <div className="group-card-grid">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                tabIndex={0}
                role="button"
                aria-label={`Open group ${group.name}`}
                className={cn(
                  "group-card group relative focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer select-none",
                  "active:scale-[0.98]"
                )}
                onClick={() => navigate(`/chat/${group.id}`)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/chat/${group.id}`); }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Banner Image */}
                <div className="w-full h-[100px] bg-muted relative">
                  <img
                    src={group.bannerUrl || '/default-group-banner.jpg'}
                    alt="Group Banner"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                {/* Card Content */}
                <div className="flex-1 flex flex-col gap-2 px-4 py-3">
                  {/* Header Row: Avatar + Name/Subject + Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="group-avatar">
                        <AvatarImage src={group.groupImageUrl} alt={group.name} />
                        <AvatarFallback>
                          {group.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || <BookOpen className="w-5 h-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <h3 className="font-semibold text-base truncate text-foreground leading-tight">{group.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{group.subject}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {/* Description */}
                  {group.description && (
                    <p className="text-xs text-muted-foreground truncate mb-1">{group.description}</p>
                  )}
                  {/* XP Progress */}
                  <div className="mb-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <Trophy className={cn("w-4 h-4", group.accentColor)} />
                        <span className="text-xs font-medium text-foreground">Lvl {group.currentLevel}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{group.xp} / {group.nextLevelXp} XP</span>
                    </div>
                    <div className="lettrblack-xp-bar h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="lettrblack-xp-fill h-full bg-primary transition-all duration-500"
                        style={{ width: `${calculateProgress(group.xp, group.nextLevelXp)}%` }}
                      ></div>
                    </div>
                  </div>
                  {/* Members */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex -space-x-2">
                      {(group.avatars || []).slice(0, 3).map((avatar, index) => (
                        <img
                          key={index}
                          src={avatar}
                          alt={`Member ${index + 1}`}
                          className="w-7 h-7 rounded-full border-2 border-card object-cover"
                          loading="lazy"
                        />
                      ))}
                      {group.members && group.members > 3 && (
                        <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-foreground">
                          +{group.members - 3}
                        </div>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {(group.members || 1)}/{group.maxMembers || 1} members
                    </span>
                  </div>
                  {/* Last Activity */}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    {group.lastActivity || "No recent activity"}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {!group.memberIds?.includes(firebaseUser?.uid) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleJoinGroup(group); }}
                        className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 rounded-lg flex items-center justify-center gap-2 text-xs py-1"
                      >
                        <Users className="w-4 h-4" />
                        Join
                      </button>
                    )}
                    <button
                      onClick={e => e.stopPropagation()}
                      className="px-2 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 rounded-lg text-xs"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {searchTerm || selectedCategory !== "All"
                ? "No groups found"
                : "No study groups yet"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your search or filters to find the groups you're looking for."
                : "Join or create your first study group to start collaborating with other learners!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleOpenModal}
                className="lettrblack-button flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Your First Group
              </button>
              <button
                onClick={() => navigate('/groups/public')}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 rounded-lg px-4 py-2 font-medium"
              >
                Browse Public Groups
              </button>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            className="lettrblack-button w-14 h-14 rounded-full shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            onClick={handleOpenModal}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Create Group Modal */}
        {modal.open && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-all duration-200">
            <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create a New Group</h2>
                <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {modal.error && (
                <div className="mb-3 text-destructive text-sm">{modal.error}</div>
              )}
              <div className="space-y-3">
                <Input
                  placeholder="Group Name *"
                  value={modal.name}
                  onChange={e => dispatchModal({ type: "SET_FIELD", field: "name", value: e.target.value })}
                  disabled={modal.loading}
                />
                <Input
                  placeholder="Subject *"
                  value={modal.subject}
                  onChange={e => dispatchModal({ type: "SET_FIELD", field: "subject", value: e.target.value })}
                  disabled={modal.loading}
                />
                <Input
                  placeholder="Description (optional)"
                  value={modal.description}
                  onChange={e => dispatchModal({ type: "SET_FIELD", field: "description", value: e.target.value })}
                  disabled={modal.loading}
                />
                {/* Banner Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Banner Image (optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-32 h-16 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                        {modal.bannerUrl ? (
                          <img
                            src={modal.bannerUrl}
                            alt="Banner preview"
                            className="w-full h-full rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-muted-foreground text-center text-xs">Add Banner</div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => {
                          const file = e.target.files && e.target.files[0];
                          const maxSize = 10 * 1024 * 1024; // 10MB
                          if (file) {
                            if (file.size > maxSize) {
                              dispatchModal({ type: "SET_ERROR", error: "Banner image too large. Max size is 10MB." });
                              return;
                            }
                            dispatchModal({ type: "SET_FIELD", field: "banner", value: file });
                            dispatchModal({ type: "SET_FIELD", field: "bannerUrl", value: URL.createObjectURL(file) });
                          }
                        }}
                        disabled={modal.loading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Upload a banner image (JPEG, PNG, WebP) for your group.
                      </p>
                      {modal.banner && (
                        <p className="text-xs text-foreground mt-1">
                          Selected: {modal.banner.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {modal.loading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      Uploading banner image...
                    </div>
                  )}
                  {modal.error && (
                    <div className="text-destructive text-xs mt-1">{modal.error}</div>
                  )}
                </div>
                {/* Group Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Group Image (optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                        {modal.imageUrl ? (
                          <img 
                            src={modal.imageUrl} 
                            alt="Group preview" 
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-muted-foreground text-center">
                            <div className="text-xs">Add</div>
                            <div className="text-xs">Photo</div>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files && e.target.files[0];
                          const maxSize = 10 * 1024 * 1024; // 10MB
                          if (file) {
                            if (file.size > maxSize) {
                              dispatchModal({ type: "SET_ERROR", error: "Group image too large. Max size is 10MB." });
                              return;
                            }
                            dispatchModal({ type: "SET_FIELD", field: "image", value: file });
                            dispatchModal({ type: "SET_FIELD", field: "imageUrl", value: URL.createObjectURL(file) });
                          }
                        }}
                        disabled={modal.loading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Upload a group image to make it easier for members to identify your group.
                      </p>
                      {modal.image && (
                        <p className="text-xs text-foreground mt-1">
                          Selected: {modal.image.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={modal.loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={modal.loading}
                >
                  {modal.loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}


      </div>
    </Layout>
  );
}
