// USERS
export interface User {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalPoints: number;
  level: number;
  xp: number;
  streak: number;
  roles: ("student" | "creator" | "admin")[];
  followers?: string[]; // for creators
  createdAt: number;
  bio?: string;
  lastLoginDate?: string;
}

// GROUPS
export interface Group {
  id: string;
  name: string;
  subject: string;
  description: string;
  bannerUrl?: string;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: number;
}

// NOTES/RESOURCES
export interface Note {
  id: string;
  groupId: string;
  authorId: string;
  type: "pdf" | "link" | "text" | "markdown";
  content: string; // URL or text
  title: string;
  starredBy: string[];
  createdAt: number;
}

// PROGRESS (per user per group)
export interface Progress {
  id: string;
  userId: string;
  groupId: string;
  tasks: { label: string; completed: boolean }[];
  updatedAt: number;
}

// LEADERBOARD (computed, not stored directly)
// Query users ordered by totalPoints or groupPoints

// PRODUCTS (Marketplace)
export interface Product {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: "ebook" | "course" | "notes";
  price: number; // 0 = free
  fileUrl: string;
  createdAt: number;
  buyers: string[];
}

// ADMIN TOOLS (for moderation, logs, etc.)
export interface AdminLog {
  id: string;
  type: string;
  targetId: string;
  message: string;
  createdAt: number;
} 