import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion
} from "firebase/firestore";
import type { User, Group, Note, Progress, Product, AdminLog } from "./firestore-structure";

// USERS
export async function createUser(user: User) {
  await setDoc(doc(db, "users", user.uid), user);
}

export async function createUserInFirestore(uid: string, userData: Partial<User> & { displayName?: string; photoURL?: string }) {
  const user: User = {
    uid,
    name: userData.name || userData.displayName || "",
    email: userData.email || "",
    avatarUrl: userData.avatarUrl || userData.photoURL || "",
    bio: userData.bio || "",
    roles: ["student"],
    xp: 0,
    level: 1,
    streak: 0,
    totalPoints: 0,
    createdAt: userData.createdAt || Date.now(),
    lastLoginDate: getTodayDate(),
  };
  await setDoc(doc(db, "users", uid), user);
}
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as User) : null;
}
export async function updateUser(uid: string, data: Partial<User>) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}
export async function deleteUser(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}

// GROUPS
export async function createGroup(group: Group) {
  const ref = doc(db, "groups", group.id);
  await setDoc(ref, group);
}
export async function getGroup(id: string) {
  const snap = await getDoc(doc(db, "groups", id));
  return snap.exists() ? (snap.data() as Group) : null;
}
export async function updateGroup(id: string, data: Partial<Group>) {
  await updateDoc(doc(db, "groups", id), data);
}

// Remove user from group
export async function removeUserFromGroup(groupId: string, userId: string) {
  const group = await getGroup(groupId);
  if (!group) return;
  
  const updatedMemberIds = group.memberIds.filter(id => id !== userId);
  await updateDoc(doc(db, "groups", groupId), { memberIds: updatedMemberIds });
}
export async function deleteGroup(id: string) {
  await deleteDoc(doc(db, "groups", id));
}
export async function getGroupsByUser(uid: string) {
  const q = query(collection(db, "groups"), where("memberIds", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Group);
}

// Get all groups (for public view or admin)
export async function getAllGroups() {
  const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Group);
}

// Get public groups (groups that are not private)
export async function getPublicGroups() {
  const q = query(collection(db, "groups"), where("isPrivate", "==", false), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Group);
}

// Real-time listener for groups
export function subscribeToGroups(uid: string, callback: (groups: Group[]) => void) {
  const q = query(collection(db, "groups"), where("memberIds", "array-contains", uid));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(d => d.data() as Group);
    callback(groups);
  });
}

// Real-time listener for all groups
export function subscribeToAllGroups(callback: (groups: Group[]) => void) {
  const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(d => d.data() as Group);
    callback(groups);
  });
}

// CHAT MESSAGES
export async function sendMessage(groupId: string, message: {
  senderId: string;
  senderName: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}) {
  const messageData = {
    id: crypto.randomUUID(),
    groupId,
    ...message,
    timestamp: serverTimestamp(),
  };
  await addDoc(collection(db, "groups", groupId, "messages"), messageData);
}

export async function getMessages(groupId: string) {
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("timestamp", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// Real-time listener for messages
export function subscribeToMessages(groupId: string, callback: (messages: any[]) => void) {
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(d => d.data());
    callback(messages);
  });
}

// NOTES
export async function createNote(note: Partial<Note>) {
  console.log("📝 createNote called with:", note);
  
  try {
    const noteWithId = {
      ...note,
      id: crypto.randomUUID(),
    } as Note;
    
    console.log("📝 Note with ID:", noteWithId);
    
    const ref = doc(db, "notes", noteWithId.id);
    console.log("📝 Firestore document reference:", ref.path);
    
    await setDoc(ref, noteWithId);
    console.log("✅ Note successfully saved to Firestore");
    
    return noteWithId.id;
  } catch (error) {
    console.error("❌ Error in createNote:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}
export async function getNote(id: string) {
  const snap = await getDoc(doc(db, "notes", id));
  return snap.exists() ? (snap.data() as Note) : null;
}
export async function updateNote(id: string, data: Partial<Note>) {
  await updateDoc(doc(db, "notes", id), data);
}
export async function deleteNote(id: string) {
  await deleteDoc(doc(db, "notes", id));
}
export async function getNotesByGroup(groupId: string) {
  const q = query(collection(db, "notes"), where("groupId", "==", groupId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Note);
}
export async function getNotesByUser(userId: string) {
  const q = query(collection(db, "notes"), where("authorId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Note);
}

// MARKETPLACE FUNCTIONS
export async function getPublicNotes() {
  const q = query(
    collection(db, "notes"), 
    where("isPublic", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Note);
}

export async function getNotesBySubject(subject: string) {
  const q = query(
    collection(db, "notes"), 
    where("isPublic", "==", true),
    where("subject", "==", subject),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Note);
}

export async function getNotesByPriceRange(minPrice: number, maxPrice: number) {
  const q = query(
    collection(db, "notes"), 
    where("isPublic", "==", true),
    where("price", ">=", minPrice),
    where("price", "<=", maxPrice),
    orderBy("price", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Note);
}

export async function searchNotes(searchTerm: string) {
  const q = query(
    collection(db, "notes"), 
    where("isPublic", "==", true),
    orderBy("title", "asc")
  );
  const snap = await getDocs(q);
  const notes = snap.docs.map(d => d.data() as Note);
  
  return notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    note.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export async function incrementNoteViews(noteId: string) {
  const noteRef = doc(db, "notes", noteId);
  await updateDoc(noteRef, {
    views: increment(1)
  });
}

export async function incrementNoteDownloads(noteId: string) {
  const noteRef = doc(db, "notes", noteId);
  await updateDoc(noteRef, {
    downloads: increment(1)
  });
}

export async function purchaseNote(noteId: string, buyerId: string, amount: number) {
  const noteRef = doc(db, "notes", noteId);
  const purchaseRef = doc(db, "purchases", crypto.randomUUID());
  
  const purchase = {
    id: purchaseRef.id,
    noteId,
    buyerId,
    sellerId: "", // Will be set from note
    amount,
    currency: "INR",
    status: "completed" as const,
    paymentMethod: "razorpay",
    createdAt: Date.now(),
  };
  
  await Promise.all([
    setDoc(purchaseRef, purchase),
    updateDoc(noteRef, {
      purchases: arrayUnion(buyerId)
    })
  ]);
  
  return purchase;
}

export async function getUserPurchases(userId: string) {
  try {
    const q = query(
      collection(db, "purchases"), 
      where("buyerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (error) {
    console.error("❌ Purchases index not ready, using simple query:", error);
    // Fallback to simple query without orderBy
    const fallbackQuery = query(
      collection(db, "purchases"), 
      where("buyerId", "==", userId)
    );
    const snap = await getDocs(fallbackQuery);
    const purchases = snap.docs.map(d => d.data());
    // Sort in memory
    purchases.sort((a, b) => b.createdAt - a.createdAt);
    return purchases;
  }
}

// Real-time listeners for marketplace
export function subscribeToPublicNotes(callback: (notes: Note[]) => void) {
  console.log("🔍 Setting up subscription to public notes...");
  
  // Try composite index first, fallback to simple query if index not ready
  const tryCompositeQuery = () => {
    const q = query(
      collection(db, "notes"), 
      where("isPublic", "==", true),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      console.log("📝 Firestore snapshot received:", snapshot.docs.length, "documents");
      const notes = snapshot.docs.map(d => {
        const data = d.data() as Note;
        console.log("📝 Note data:", { id: d.id, title: data.title, isPublic: data.isPublic });
        return data;
      });
      callback(notes);
    }, (error) => {
      console.error("❌ Composite index not ready, falling back to simple query:", error);
      // Fallback to simple query without orderBy
      const fallbackQuery = query(
        collection(db, "notes"), 
        where("isPublic", "==", true)
      );
      return onSnapshot(fallbackQuery, (snapshot) => {
        console.log("📝 Fallback query received:", snapshot.docs.length, "documents");
        const notes = snapshot.docs.map(d => {
          const data = d.data() as Note;
          console.log("📝 Note data:", { id: d.id, title: data.title, isPublic: data.isPublic });
          return data;
        });
        // Sort in memory
        notes.sort((a, b) => b.createdAt - a.createdAt);
        callback(notes);
      }, (fallbackError) => {
        console.error("❌ Fallback query also failed:", fallbackError);
      });
    });
  };
  
  return tryCompositeQuery();
}

// PROGRESS
export async function setProgress(progress: Progress) {
  await setDoc(doc(db, "progress", progress.id), progress);
}
export async function getProgress(id: string) {
  const snap = await getDoc(doc(db, "progress", id));
  return snap.exists() ? (snap.data() as Progress) : null;
}
export async function updateProgress(id: string, data: Partial<Progress>) {
  await updateDoc(doc(db, "progress", id), data);
}
export async function getProgressByUserGroup(userId: string, groupId: string) {
  const q = query(collection(db, "progress"), where("userId", "==", userId), where("groupId", "==", groupId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Progress);
}

export async function getProgressByUser(userId: string) {
  const q = query(collection(db, "progress"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Progress);
}

export async function updateProgressTask(progressId: string, taskLabel: string, completed: boolean) {
  const snap = await getDoc(doc(db, "progress", progressId));
  if (!snap.exists()) return;
  const progress = snap.data() as Progress;
  const updatedTasks = progress.tasks.map(t => t.label === taskLabel ? { ...t, completed } : t);
  await updateDoc(doc(db, "progress", progressId), { tasks: updatedTasks, updatedAt: Date.now() });
}

// PRODUCTS
export async function createProduct(product: Product) {
  const ref = doc(db, "products", product.id);
  await setDoc(ref, product);
}
export async function getProduct(id: string) {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? (snap.data() as Product) : null;
}
export async function updateProduct(id: string, data: Partial<Product>) {
  await updateDoc(doc(db, "products", id), data);
}
export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id));
}
export async function getProductsByCreator(creatorId: string) {
  const q = query(collection(db, "products"), where("creatorId", "==", creatorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Product);
}

// ADMIN LOGS
export async function createAdminLog(log: AdminLog) {
  const ref = doc(db, "adminLogs", log.id);
  await setDoc(ref, log);
}
export async function getAdminLogs(limitCount = 20) {
  const q = query(collection(db, "adminLogs"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AdminLog);
}

// XP & Gamification Utilities

/**
 * Add XP to a user for a specific action, with daily cap enforcement.
 * @param uid User ID
 * @param amount XP amount
 * @param action Action type (e.g., 'create_group', 'upload_note')
 * @param dailyCap Max XP per day for this action
 * @returns {Promise<boolean>} true if XP was added, false if cap reached
 */
export async function addXpToUser(uid: string, amount: number, action: string, dailyCap: number): Promise<boolean> {
  const userRef = doc(db, "users", uid);
  const xpLogRef = doc(db, "users", uid, "xpLogs", getTodayDate());
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return false;
  const user = userSnap.data() as User;

  // Get or create today's XP log
  let xpLog: any = {};
  const logSnap = await getDoc(xpLogRef);
  if (logSnap.exists()) {
    xpLog = logSnap.data();
  }
  if (!xpLog[action]) xpLog[action] = 0;

  if (xpLog[action] >= dailyCap) return false; // Cap reached
  const xpToAdd = Math.min(amount, dailyCap - xpLog[action]);
  xpLog[action] += xpToAdd;

  // Update XP, level
  let newXp = (user.xp || 0) + xpToAdd;
  let newLevel = Math.floor(newXp / 100) + 1;
  const leveledUp = newLevel > (user.level || 1);

  await Promise.all([
    setDoc(xpLogRef, xpLog, { merge: true }),
    setDoc(userRef, { xp: newXp, level: newLevel }, { merge: true })
  ]);
  return leveledUp;
}

/**
 * Utility to get today's date as YYYY-MM-DD string
 */
function getTodayDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Update streak on login. Returns new streak count.
 */
export async function updateStreakOnLogin(uid: string): Promise<number> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return 0;
  const user = userSnap.data() as User;
  const today = getTodayDate();
  const lastLogin = user.lastLoginDate;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = 1;
  if (lastLogin === yesterdayStr) {
    newStreak = (user.streak || 0) + 1;
  }
  await setDoc(userRef, { streak: newStreak, lastLoginDate: today }, { merge: true });
  return newStreak;
}

/**
 * Utility to check if user can earn XP for an action today (for UI feedback)
 */
export async function canEarnXp(uid: string, action: string, dailyCap: number): Promise<boolean> {
  const xpLogRef = doc(db, "users", uid, "xpLogs", getTodayDate());
  const logSnap = await getDoc(xpLogRef);
  if (!logSnap.exists()) return true;
  const xpLog = logSnap.data();
  return (xpLog[action] || 0) < dailyCap;
} 