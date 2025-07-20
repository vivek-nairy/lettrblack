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
  groupImageUrl?: string;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: number;
  isPrivate?: boolean;
}

// NOTES/RESOURCES
export interface Note {
  id: string;
  groupId?: string; // Optional for marketplace notes
  authorId: string;
  authorName: string;
  type: "pdf" | "link" | "text" | "markdown" | "docx" | "doc" | "image";
  content: string; // URL or text
  title: string;
  description?: string;
  tags: string[];
  subject: string;
  price: number; // 0 = free
  fileUrl?: string;
  coverImageUrl?: string;
  starredBy: string[];
  views: number;
  downloads: number;
  purchases: string[]; // Array of user IDs who purchased
  isPublic: boolean; // For marketplace visibility
  createdAt: number;
  updatedAt: number;
}

// PURCHASES
export interface Purchase {
  id: string;
  noteId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  transactionId?: string;
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

// MESSAGES (for group chat)
export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

// ADMIN TOOLS (for moderation, logs, etc.)
export interface AdminLog {
  id: string;
  type: string;
  targetId: string;
  message: string;
  createdAt: number;
}

// VIDEO CALLS
export interface VideoCall {
  groupId: string;
  roomId: string;
  participants: VideoCallParticipant[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface VideoCallParticipant {
  userId: string;
  userName: string;
  isConnected: boolean;
  joinedAt: number;
  leftAt?: number;
}

export interface VideoCallSignal {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId?: string; // undefined for broadcast signals
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  data: any;
  timestamp: number;
} 