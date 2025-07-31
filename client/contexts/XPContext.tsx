import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import confetti from "canvas-confetti";
import { useAuthUser } from "../hooks/useAuthUser";

interface XPContextType {
  triggerXPConfetti: (xpGained: number, message?: string) => void;
  showConfetti: boolean;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

interface XPProviderProps {
  children: ReactNode;
}

export function XPProvider({ children }: XPProviderProps) {
  const { user } = useAuthUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const previousXPRef = useRef<{ xp: number; level: number } | null>(null);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track XP changes from user data
  useEffect(() => {
    if (!user) return;

    const currentXP = {
      xp: user.xp || 0,
      level: user.level || 1
    };

    // Skip on initial load
    if (!previousXPRef.current) {
      previousXPRef.current = currentXP;
      return;
    }

    const previousXP = previousXPRef.current;
    const xpGained = currentXP.xp - previousXP.xp;
    const levelGained = currentXP.level - previousXP.level;

    // Only trigger confetti if XP actually increased
    if (xpGained > 0 || levelGained > 0) {
      triggerXPConfetti(xpGained, levelGained > 0 ? "Level Up!" : undefined);
    }

    previousXPRef.current = currentXP;
  }, [user?.xp, user?.level]);

  const triggerXPConfetti = (xpGained: number, message?: string) => {
    // Clear any existing timeout
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current);
    }

    // Trigger confetti
    setShowConfetti(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
    });

    // Hide confetti after 3 seconds
    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  return (
    <XPContext.Provider value={{ triggerXPConfetti, showConfetti }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error("useXP must be used within an XPProvider");
  }
  return context;
} 