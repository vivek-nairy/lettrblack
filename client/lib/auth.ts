import { auth, db } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import type { User } from "./firestore-structure";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  await createUserProfile(user);
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await createUserProfile(result.user);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(result.user, name);
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

async function createUserProfile(user: FirebaseUser, nameOverride?: string) {
  if (!user) return;
  const userData: User = {
    uid: user.uid,
    name: nameOverride || user.displayName || "",
    email: user.email || "",
    avatarUrl: user.photoURL || undefined,
    totalPoints: 0,
    level: 1,
    xp: 0,
    streak: 0,
    roles: ["student"],
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "users", user.uid), userData, { merge: true });
} 