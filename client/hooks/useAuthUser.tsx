import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser, updateStreakOnLogin, addXpToUser } from "@/lib/firestore-utils";
import type { User } from "@/lib/firestore-structure";

export function useAuthUser() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await getUser(firebaseUser.uid);
          setUser(userData);
          // Update streak and award streak bonus XP if streak >= 3
          const streak = await updateStreakOnLogin(firebaseUser.uid);
          if (streak >= 3) {
            await addXpToUser(firebaseUser.uid, 15, 'streak_bonus', 15);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    firebaseUser, 
    loading,
    isAuthenticated: !!firebaseUser 
  };
} 