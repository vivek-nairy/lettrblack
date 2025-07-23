import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Crown,
  Trophy,
  Medal,
  Star,
  Users,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  Zap,
  Target,
  TrendingUp,
  Award,
  Flame,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Podium styles for top 3
const podiumColors: Record<number, string> = {
  1: "from-yellow-400 to-yellow-600",
  2: "from-gray-300 to-gray-500",
  3: "from-orange-400 to-orange-600",
};
const podiumHeights: Record<number, string> = {
  1: "h-32",
  2: "h-24",
  3: "h-20",
};
const rankIcons: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("global");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [sortBy, setSortBy] = useState("xp");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  useEffect(() => {
    // Fetch top users by XP
    const fetchLeaderboard = async () => {
      const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
      const snap = await getDocs(q);
      const users = snap.docs.map((d, i) => ({ ...d.data(), rank: i + 1 }));
      setLeaderboard(users);
    };
    fetchLeaderboard();
  }, []);

  const currentUser = leaderboard.find((user) => user.isCurrentUser);
  const topThree = leaderboard.slice(0, 3);
  const remainingUsers = leaderboard.slice(3);

  const getDisplayValue = (user: any) => {
    switch (sortBy) {
      case "tasks":
        return user.tasksCompleted;
      case "streak":
        return user.streak;
      default:
        return user.xp.toLocaleString();
    }
  };

  const getDisplayLabel = () => {
    switch (sortBy) {
      case "tasks":
        return "Tasks";
      case "streak":
        return "Day Streak";
      default:
        return "XP";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            See how you rank against top learners
          </p>
        </div>

        {/* Filters */}
        <div className="lettrblack-card p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Group Selection */}
            <div className="relative">
              <button
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-colors min-w-64"
              >
                <Users className="w-4 h-4" />
                <span>
                  {/* studyGroups.find((g) => g.id === selectedGroup)?.name */}
                  Global Leaderboard
                </span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
              {showGroupDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10">
                  {/* {studyGroups.map((group) => ( */}
                  <button
                    key="global"
                    onClick={() => {
                      setSelectedGroup("global");
                      setShowGroupDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg",
                      selectedGroup === "global" &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Global Leaderboard</span>
                      <span className="text-sm text-muted-foreground">
                        {/* {group.memberCount} members */}
                        1250 members
                      </span>
                    </div>
                  </button>
                  {/* )} */}
                </div>
              )}
            </div>

            {/* Timeframe */}
            <div className="flex bg-muted rounded-lg p-1">
              {/* {timeframes.map((timeframe) => ( */}
              <button
                key="all"
                onClick={() => setSelectedTimeframe("all")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  selectedTimeframe === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingUp className="w-4 h-4" />
                All Time
              </button>
              {/* )} */}
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {/* {sortOptions.map((option) => ( */}
              <option key="xp" value="xp">
                Sort by Total XP
              </option>
              <option key="tasks" value="tasks">
                Sort by Tasks Completed
              </option>
              <option key="streak" value="streak">
                Sort by Longest Streak
              </option>
              {/* )} */}
            </select>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="lettrblack-card p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Top Performers
          </h2>

          <div className="flex items-end justify-center gap-8 mb-8">
            {/* Reorder for podium effect: 2nd, 1st, 3rd */}
            {[topThree[1], topThree[0], topThree[2]].map(
              (user, visualIndex) => {
                if (!user) return null;
                const actualRank = user.rank;
                const isWinner = actualRank === 1;

                return (
                  <div
                    key={user.rank}
                    className={cn(
                      "flex flex-col items-center space-y-4 transition-all duration-300 hover:scale-105",
                      isWinner && "relative z-10",
                    )}
                  >
                    {/* Avatar with glow effect */}
                    <div className="relative">
                      <div
                        className={cn(
                          "relative p-1 rounded-full bg-gradient-to-br transition-all duration-300",
                          actualRank === 1 &&
                            "from-yellow-400 to-yellow-600 shadow-2xl shadow-yellow-400/25 animate-pulse",
                          actualRank === 2 &&
                            "from-gray-300 to-gray-500 shadow-xl shadow-gray-400/20",
                          actualRank === 3 &&
                            "from-orange-400 to-orange-600 shadow-xl shadow-orange-400/20",
                        )}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className={cn(
                              "rounded-full object-cover",
                              isWinner ? "w-24 h-24" : "w-20 h-20",
                            )}
                          />
                        ) : (
                          <div className={cn(
                            "bg-purple-500 flex items-center justify-center text-white font-bold",
                            isWinner ? "w-24 h-24 rounded-full text-4xl" : "w-20 h-20 rounded-full text-3xl"
                          )}>
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      {/* Rank badge */}
                      <div
                        className={cn(
                          "absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg",
                          podiumColors[actualRank],
                        )}
                      >
                        <span className="text-lg">{rankIcons[actualRank]}</span>
                      </div>
                      {/* Winner crown effect */}
                      {isWinner && (
                        <div className="absolute left-1/2 top-0 flex justify-center w-full" style={{ transform: 'translate(-50%, -70%)' }}>
                          <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
                        </div>
                      )}
                    </div>

                    {/* Podium */}
                    <div
                      className={cn(
                        "relative w-20 rounded-t-lg bg-gradient-to-br shadow-lg transition-all duration-300",
                        podiumHeights[actualRank],
                        podiumColors[actualRank],
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-t-lg"></div>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white font-bold text-2xl">
                        {actualRank}
                      </div>
                    </div>

                    {/* User info */}
                    <div className="text-center space-y-2">
                      <h3
                        className={cn(
                          "font-bold",
                          isWinner
                            ? "text-xl text-yellow-400"
                            : "text-lg text-foreground",
                        )}
                      >
                        {user.name}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Zap
                            className={cn(
                              "w-4 h-4",
                              isWinner ? "text-yellow-400" : "text-primary",
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold",
                              isWinner ? "text-yellow-400" : "text-primary",
                            )}
                          >
                            {getDisplayValue(user)} {getDisplayLabel()}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3" />
                          Level {user.level}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Flame className="w-3 h-3" />
                          {user.streak} day streak
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Current User Highlight */}
        {currentUser && currentUser.rank > 3 && (
          <div className="lettrblack-card p-6 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Your Position
                </h3>
                <p className="text-muted-foreground">
                  You're currently ranked #{currentUser.rank} out of{" "}
                  {leaderboard.length} learners
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  #{currentUser.rank}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getDisplayValue(currentUser)} {getDisplayLabel()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="lettrblack-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Rankings #{topThree.length + 1} - {leaderboard.length}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    {getDisplayLabel()}
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Level
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody>
                {remainingUsers.map((user) => (
                  <tr
                    key={user.rank}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-muted/30",
                      user.isCurrentUser &&
                        "bg-primary/5 border-primary/20 hover:bg-primary/10",
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-bold text-lg",
                            user.isCurrentUser
                              ? "text-primary"
                              : "text-foreground",
                          )}
                        >
                          #{user.rank}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <h3
                            className={cn(
                              "font-medium",
                              user.isCurrentUser
                                ? "text-primary"
                                : "text-foreground",
                            )}
                          >
                            {user.name}{" "}
                            {user.isCurrentUser && (
                              <span className="text-xs text-primary">
                                (You)
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.groupsJoined} groups joined
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "font-semibold",
                          user.isCurrentUser
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        {getDisplayValue(user)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="font-medium">{user.level}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>{user.streak} days</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More */}
        <div className="text-center">
          <button className="lettrblack-button flex items-center gap-2 mx-auto">
            Load More Results
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
