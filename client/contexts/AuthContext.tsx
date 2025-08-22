import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUser, updateStreakOnLogin, addXpToUser } from '@/lib/firestore-utils';
import type { User } from '@/lib/firestore-structure';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  showSignInModal: boolean;
  setShowSignInModal: (show: boolean) => void;
  requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);

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

  const requireAuth = (action: () => void) => {
    if (firebaseUser) {
      action();
    } else {
      setShowSignInModal(true);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!firebaseUser,
    showSignInModal,
    setShowSignInModal,
    requireAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
