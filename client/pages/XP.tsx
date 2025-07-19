import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Trophy,
  Zap,
  Target,
  Star,
  Check,
  ChevronRight,
  Crown,
  Flame,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Upload,
  Award,
  TrendingUp,
  Sparkles,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/firestore-utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useNavigate } from "react-router-dom";

export function XP() {
  const { user, firebaseUser } = useAuthUser();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    currentXP: 0,
    currentLevel: 1,
    nextLevelXP: 100,
    totalXP: 0,
    rank: 0,
    weeklyXP: 0,
    dailyStreak: 0,
    achievements: [],
  });
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setUserStats({
        currentXP: user.xp || 0,
        currentLevel: user.level || 1,
        nextLevelXP: ((user.level || 1) + 1) * 100,
        totalXP: user.xp || 0,
        rank: 0, // This would need to be calculated from leaderboard
        weeklyXP: 0, // This would need to be calculated
        dailyStreak: user.streak || 0,
        achievements: [], // This would come from achievements collection
      });
    }
  }, [user]);

  const calculateProgress = () => {
    const progressXP = userStats.currentXP;
    const levelStartXP = Math.floor(userStats.currentLevel * 1000); // Rough calculation
    const levelEndXP = userStats.nextLevelXP;
    return ((progressXP - levelStartXP) / (levelEndXP - levelStartXP)) * 100;
  };

  const xpToNextLevel = userStats.nextLevelXP - userStats.currentXP;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">XP Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track your learning progress and unlock achievements
          </p>
        </div>

        {/* XP Summary Card */}
        <div className="lettrblack-card p-8 bg-gradient-to-br from-card to-card/50 border-primary/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Level & Progress */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer",
                    hoveredBadge === 0 &&
                      "scale-110 shadow-2xl shadow-primary/25",
                  )}
                  onMouseEnter={() => setHoveredBadge(0)}
                  onMouseLeave={() => setHoveredBadge(null)}
                >
                  <span className="text-2xl font-bold text-white">
                    {userStats.currentLevel}
                  </span>
                  {hoveredBadge === 0 && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-purple-600 animate-pulse"></div>
                  )}
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Level {userStats.currentLevel}
                  </h2>
                  <p className="text-primary font-semibold mb-1">
                    {(userStats.currentXP ?? 0).toLocaleString()} XP
                  </p>
                  <p className="text-muted-foreground">
                    You're only{" "}
                    <span className="text-primary font-medium">
                      {xpToNextLevel} XP
                    </span>{" "}
                    away from Level {userStats.currentLevel + 1}!
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Level {userStats.currentLevel}
                  </span>
                  <span className="text-muted-foreground">
                    Level {userStats.currentLevel + 1}
                  </span>
                </div>
                <div className="lettrblack-xp-bar h-4 bg-gradient-to-r from-muted to-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${calculateProgress()}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {(userStats.weeklyXP ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">Weekly XP</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {(userStats.dailyStreak ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="lettrblack-card">
          <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Achievements & Badges
          </h2>
          <div className="text-center text-muted-foreground">No badges yet. Start earning achievements!</div>
        </div>

        {/* Challenges Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Challenges */}
          <div className="lettrblack-card">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Daily Challenges
            </h2>
            <div className="text-center text-muted-foreground">No daily challenges yet.</div>
          </div>

          {/* Weekly Challenges */}
          <div className="lettrblack-card">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Weekly Challenges
            </h2>
            <div className="text-center text-muted-foreground">No weekly challenges yet.</div>
          </div>
        </div>

        {/* Leaderboard & XP History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard Preview */}
          <div className="lettrblack-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Top Learners
              </h2>
              <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
                View Full Leaderboard
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center text-muted-foreground">No leaderboard data yet.</div>
          </div>

          {/* XP History */}
          <div className="lettrblack-card">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent XP Activity
            </h2>
            <div className="text-center text-muted-foreground">No XP history yet.</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
