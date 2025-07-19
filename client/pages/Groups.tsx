import { useEffect, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGroupsByUser, createGroup } from "@/lib/firestore-utils";
import { addXpToUser } from "@/lib/firestore-utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GroupChat } from "@/components/GroupChat";

const categories = ["All", "Programming", "Math", "Language", "Science"];
const sortOptions = [
  "Recent Activity",
  "Most XP",
  "Most Members",
  "Alphabetical",
];

export function Groups() {
  const { user, firebaseUser } = useAuthUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Recent Activity");
  const [showFilters, setShowFilters] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupSubject, setCreateGroupSubject] = useState("");
  const [createGroupDescription, setCreateGroupDescription] = useState("");
  const [createGroupError, setCreateGroupError] = useState("");
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupImage, setCreateGroupImage] = useState<File | null>(null);
  const [createGroupImageUrl, setCreateGroupImageUrl] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  useEffect(() => {
    if (firebaseUser) {
      getGroupsByUser(firebaseUser.uid).then(setGroups);
    }
  }, [firebaseUser]);

  const handleCreateGroup = async () => {
    setCreateGroupError("");
    if (!firebaseUser) {
      setCreateGroupError("You must be signed in to create a group.");
      return;
    }
    if (!createGroupName.trim() || !createGroupSubject.trim()) {
      setCreateGroupError("Group name and subject are required.");
      return;
    }
    setCreateGroupLoading(true);
    try {
      let bannerUrl = "";
      if (createGroupImage) {
        const fileRef = ref(storage, `group-banners/${firebaseUser.uid}_${Date.now()}_${createGroupImage.name}`);
        await uploadBytes(fileRef, createGroupImage);
        bannerUrl = await getDownloadURL(fileRef);
      }
      const newGroup = {
        name: createGroupName.trim(),
        subject: createGroupSubject.trim(),
        description: createGroupDescription.trim(),
        bannerUrl,
        id: crypto.randomUUID(),
        ownerId: firebaseUser.uid,
        memberIds: [firebaseUser.uid],
        inviteCode: Math.random().toString(36).substring(2, 8),
        createdAt: Date.now(),
      };
      await createGroup(newGroup);
      await addXpToUser(firebaseUser.uid, 50, "create_group", 50);
      handleCancelCreateGroup();
      getGroupsByUser(firebaseUser.uid).then(setGroups);
    } catch (err) {
      setCreateGroupError(
        err?.message || "Failed to create group. Please try again."
      );
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const handleCancelCreateGroup = () => {
    setShowCreateModal(false);
    setCreateGroupName("");
    setCreateGroupSubject("");
    setCreateGroupDescription("");
    setCreateGroupImage(null);
    setCreateGroupImageUrl("");
    setCreateGroupError("");
    setCreateGroupLoading(false);
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

  // Add handler to open group details
  const handleOpenGroup = (group: any) => {
    setSelectedGroup(group);
  };
  // Add handler to close group details
  const handleCloseGroup = () => {
    setSelectedGroup(null);
  };

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Study Groups
            </h1>
            <p className="text-muted-foreground">
              Collaborate, learn, and grow with your study communities
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className={cn(
                  "group relative bg-gradient-to-br",
                  group.color,
                  "border border-border rounded-xl p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer backdrop-blur-sm",
                )}
                onClick={() => handleOpenGroup(group)}
              >
                {/* Active Indicator */}
                {group.isActive && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          group.bgAccent,
                        )}
                      >
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {group.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {group.subject}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {group.description}
                    </p>
                  </div>

                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* XP Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className={cn("w-4 h-4", group.accentColor)} />
                      <span className="text-sm font-medium text-foreground">
                        Level {group.currentLevel}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {group.xp} / {group.nextLevelXp} XP
                    </span>
                  </div>
                  <div className="lettrblack-xp-bar h-2">
                    <div
                      className="lettrblack-xp-fill h-full transition-all duration-500"
                      style={{
                        width: `${calculateProgress(group.xp, group.nextLevelXp)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Members */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {(group.avatars || []).slice(0, 4).map((avatar, index) => (
                      <img
                        key={index}
                        src={avatar}
                        alt={`Member ${index + 1}`}
                        className="w-8 h-8 rounded-full border-2 border-background object-cover"
                      />
                    ))}
                    {group.members && group.members > 4 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-foreground">
                        +{group.members - 4}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {(group.members || 1)}/{group.maxMembers || 1} members
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {group.lastActivity || "No recent activity"}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="flex-1 lettrblack-button flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Enter Group
                  </button>
                  <button className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </button>
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
                onClick={() => setShowCreateModal(true)}
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
          <button className="lettrblack-button w-14 h-14 rounded-full shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Create Group Modal */}
        <Dialog open={showCreateModal} onOpenChange={handleCancelCreateGroup}>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Create a New Group</h2>
              {createGroupError && (
                <div className="mb-3 text-destructive text-sm">{createGroupError}</div>
              )}
              <div className="space-y-3">
                <Input
                  placeholder="Group Name *"
                  value={createGroupName}
                  onChange={e => setCreateGroupName(e.target.value)}
                  disabled={createGroupLoading}
                />
                <Input
                  placeholder="Subject *"
                  value={createGroupSubject}
                  onChange={e => setCreateGroupSubject(e.target.value)}
                  disabled={createGroupLoading}
                />
                <Input
                  placeholder="Description (optional)"
                  value={createGroupDescription}
                  onChange={e => setCreateGroupDescription(e.target.value)}
                  disabled={createGroupLoading}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Group Banner (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setCreateGroupImage(e.target.files[0]);
                        setCreateGroupImageUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    disabled={createGroupLoading}
                  />
                  {createGroupImageUrl && (
                    <img src={createGroupImageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border" />
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <Button
                  variant="secondary"
                  onClick={handleCancelCreateGroup}
                  disabled={createGroupLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={createGroupLoading}
                >
                  {createGroupLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>

        {/* Group Details Modal with Chat */}
        {selectedGroup && (
          <Dialog open={!!selectedGroup} onOpenChange={handleCloseGroup}>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 relative">
                <button
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                  onClick={handleCloseGroup}
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-2">{selectedGroup?.name || "No name"}</h2>
                <p className="text-muted-foreground mb-2">{selectedGroup?.subject || "No subject"}</p>
                {selectedGroup?.bannerUrl && (
                  <img src={selectedGroup.bannerUrl} alt="Banner" className="mb-4 w-full h-40 object-cover rounded-lg" />
                )}
                <p className="mb-4">{selectedGroup?.description || "No description"}</p>
                <div className="mb-4">
                  <strong>Invite Code:</strong> {selectedGroup?.inviteCode || "-"}
                </div>
                <div className="mb-4">
                  <strong>Created:</strong> {selectedGroup?.createdAt ? new Date(selectedGroup.createdAt).toLocaleString() : "-"}
                </div>
                <div className="mb-4">
                  <strong>Owner:</strong> {selectedGroup?.ownerId || "-"}
                </div>
                <div className="mb-4">
                  <strong>Members:</strong> {selectedGroup?.memberIds?.length || 1}
                </div>
                <div className="mb-4">
                  <GroupChat groupId={selectedGroup?.id || ""} />
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
