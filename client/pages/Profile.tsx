import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Edit3, Settings, Trophy, Users, BookOpen, Award, Star, Eye, Download, Calendar, FileText, Link, Video, Plus, ChevronRight, Zap, TrendingUp, Heart, MoreVertical, ExternalLink, Upload, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotesByUser, getProgressByUser, getUser, updateUser, getGroupsByUser } from "@/lib/firestore-utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuthUser } from "../hooks/useAuthUser";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const noteTypeIcons = { pdf: FileText, link: Link, text: BookOpen };
const noteTypeColors = { pdf: "bg-red-500/10 text-red-400", link: "bg-blue-500/10 text-blue-400", text: "bg-green-500/10 text-green-400" };

export function Profile() {
  const { user, firebaseUser } = useAuthUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userNotes, setUserNotes] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", bio: "", avatarUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
  });

  useEffect(() => {
    if (firebaseUser) {
      getUser(firebaseUser.uid).then(setProfile);
      getNotesByUser(firebaseUser.uid).then(setUserNotes);
      getProgressByUser(firebaseUser.uid).then(setUserProgress);
      getGroupsByUser(firebaseUser.uid).then(setGroups);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const handleEditOpen = () => {
    setEditData({
      name: profile?.name || "",
      bio: profile?.bio || "",
      avatarUrl: profile?.avatarUrl || "",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: any) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: any) => {
    if (!firebaseUser) return;
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const avatarRef = ref(storage, `users/${firebaseUser.uid}/profile.jpg`);
      const uploadTask = uploadBytesResumable(avatarRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          // Optionally, you can show progress here
        },
        (error) => {
          setUploading(false);
          alert('Upload failed: ' + error.message);
        },
        async () => {
          const url = await getDownloadURL(avatarRef);
          setEditData((prev) => ({ ...prev, avatarUrl: url }));
          // Update Firestore profileImage
          await updateUser(firebaseUser.uid, { profileImage: url });
          setUploading(false);
          alert('Profile picture updated!');
        }
      );
    } catch (error) {
      setUploading(false);
      alert('Upload failed: ' + error.message);
    }
  };

  const handleEditSave = async () => {
    if (!firebaseUser) return;
    const updateData: any = {
      name: editData.name,
      avatarUrl: editData.avatarUrl,
    };
    if (editData.bio !== undefined) updateData.bio = editData.bio;
    await updateUser(firebaseUser.uid, updateData);
    getUser(firebaseUser.uid).then(setProfile);
    setShowEditModal(false);
  };

  const handleSaveProfile = async () => {
    if (!firebaseUser) return;
    try {
      await updateUser(firebaseUser.uid, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Add this function in the Profile component
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Calculate overall progress percentage
  const totalTasks = userProgress.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = userProgress.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tabs = [
    { id: "overview", name: "Overview", icon: Trophy },
    { id: "notes", name: "My Notes", icon: BookOpen },
    { id: "groups", name: "My Groups", icon: Users },
  ];
  if (profile?.isCreator) {
    tabs.push({ id: "creator", name: "Creator Dashboard", icon: Upload });
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="lettrblack-card p-8 bg-gradient-to-r from-card to-card/50 border-primary/20">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <img
                  src={user?.avatarUrl || firebaseUser?.photoURL || "/placeholder.svg"}
                  alt={user?.name || firebaseUser?.displayName || "User"}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-primary/20"
                />
                {profile?.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-card">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={handleEditOpen}
                className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="mt-2 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-lg transition-colors flex items-center gap-2"
              >
                Sign Out
              </button>
            </div>
            {/* User Details */}
            <div className="flex-1 space-y-4">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {user?.name || firebaseUser?.displayName || "User"}
                  </h1>
                  {profile?.isCreator && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      Creator
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-1">{user?.email || firebaseUser?.email}</p>
                <p className="text-sm text-muted-foreground">
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                </p>
              </div>
              {profile?.bio && (
                <p className="text-foreground leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}
              {/* XP Progress */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">
                        {profile?.level || 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Level {profile?.level || 1}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {profile?.xp?.toLocaleString() || 0} XP
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {profile?.xpToNextLevel ? profile.xpToNextLevel : ((profile?.level || 1) * 1000) - (profile?.xp || 0)} XP to Level {((profile?.level || 1) + 1)}
                    </p>
                  </div>
                </div>
                <div className="lettrblack-xp-bar h-3">
                  <div
                    className="lettrblack-xp-fill h-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {/* Settings Link */}
            <div className="flex lg:flex-col gap-2">
              <button
                onClick={() => navigate('/settings')}
                className="p-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate(`/profile/${user?.uid}`)}
                className="p-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                <Eye className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-muted/30 p-2 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Groups */}
            <div className="lettrblack-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  My Groups
                </h2>
                <button
                  onClick={() => navigate('/groups')}
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {groups.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No groups yet. Create your first study group!
                  </p>
                ) : (
                  groups.slice(0, 3).map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{group.memberIds?.length || 1} members</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Recent Notes */}
            <div className="lettrblack-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Notes
                </h2>
                <button
                  onClick={() => navigate('/notes')}
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {userNotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notes found. Start by adding one.
                  </p>
                ) : (
                  userNotes.slice(0, 3).map((note) => {
                    const IconComponent = noteTypeIcons[note.type];
                    return (
                      <div
                        key={note.id}
                        className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            noteTypeColors[note.type],
                          )}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {note.title}
                          </h3>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "notes" && (
          <div className="lettrblack-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                All My Notes
              </h2>
              <button
                onClick={() => navigate('/notes/add')}
                className="lettrblack-button flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Note
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notes found. Start by adding one.
                </p>
              ) : (
                userNotes.map((note) => {
                  const IconComponent = noteTypeIcons[note.type];
                  return (
                    <div
                      key={note.id}
                      className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            noteTypeColors[note.type],
                          )}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <button className="p-1 hover:bg-muted rounded">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      <h3 className="font-medium text-foreground mb-2">
                        {note.title}
                      </h3>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        {activeTab === "groups" && (
          <div className="lettrblack-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                My Groups ({groups.length})
              </h2>
              <button
                onClick={() => navigate('/groups/create')}
                className="lettrblack-button flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Join New Group
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No groups yet. Create your first study group!
                </p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="border border-border rounded-xl p-6 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {group.name}
                        </h3>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 bg-muted text-muted-foreground">
                          Member
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground bg-background"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-1">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editData.bio}
                  onChange={handleEditChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground bg-background"
                />
              </div>
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-muted-foreground mb-1">Avatar</label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-primary-foreground border border-border rounded-lg cursor-pointer bg-primary/5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
              </div>
              <div className="flex flex-col items-center gap-2 mb-4">
                {editData.avatarUrl && (
                  <img
                    src={editData.avatarUrl}
                    alt="Avatar Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
