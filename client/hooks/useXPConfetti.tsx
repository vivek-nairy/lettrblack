import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useAuthUser } from "./useAuthUser";

interface XPChange {
  xp: number;
  level: number;
  timestamp: number;
}

export function useXPConfetti() {
  const { user } = useAuthUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const previousXPRef = useRef<XPChange | null>(null);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const currentXP = {
      xp: user.xp || 0,
      level: user.level || 1,
      timestamp: Date.now()
    };

    // Skip on initial load (no previous XP data)
    if (!previousXPRef.current) {
      previousXPRef.current = currentXP;
      return;
    }

    const previousXP = previousXPRef.current;
    const xpGained = currentXP.xp - previousXP.xp;
    const levelGained = currentXP.level - previousXP.level;

    // Only trigger confetti if XP actually increased (not just data refresh)
    if (xpGained > 0 || levelGained > 0) {
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
    }

    // Update previous XP reference
    previousXPRef.current = currentXP;
  }, [user?.xp, user?.level]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  return { showConfetti };
} 