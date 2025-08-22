import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  BookOpen,
  Clock,
  TrendingUp,
  Star,
  Zap,
  Target,
  Award,
  Flame,
  LogIn,
  UserPlus,
} from "lucide-react";
import { getGroupsByUser, getProgressByUser } from "@/lib/firestore-utils";
import { useAuth } from "../contexts/AuthContext";
import { useXPConfetti } from "../hooks/useXPConfetti";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AIChatWidget } from "../components/AIChatWidget";

export function Index() {
  const { user, firebaseUser, isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [progress, setProgress] = useState([]);
  const { toast } = useToast();
  const { showConfetti } = useXPConfetti();
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (firebaseUser) {
      getGroupsByUser(firebaseUser.uid).then(setGroups);
      getProgressByUser(firebaseUser.uid).then(setProgress);
    }
  }, [firebaseUser]);

  // XP/Level progress calculation
  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const streak = user?.streak || 0;
  const xpProgress = Math.min((xp % 100) / 100 * 100, 100);

  const handleNavigateToGroups = () => {
    requireAuth(() => navigate("/groups"));
  };

  const handleNavigateToNotes = () => {
    requireAuth(() => navigate("/notes"));
  };

  const handleNavigateToXP = () => {
    requireAuth(() => navigate("/xp"));
  };

  const handleNavigateToLeaderboard = () => {
    requireAuth(() => navigate("/leaderboard"));
  };

  const handleJoinGroup = () => {
    requireAuth(() => navigate("/groups"));
  };

  const handleToggleAI = () => {
    requireAuth(() => setAiOpen((v) => !v));
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isAuthenticated 
                ? `Welcome back, ${user?.name || firebaseUser?.displayName || "Student"}! 👋`
                : "Welcome to LettrBlack! 👋"
              }
            </h1>
            <p className="text-muted-foreground">
              {isAuthenticated 
                ? "Ready to continue your learning journey?"
                : "Discover a new way to learn and collaborate with students worldwide"
              }
            </p>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{streak} day streak</span>
                </div>
                <p className="text-sm text-muted-foreground">Keep it up!</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => requireAuth(() => {})} variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button onClick={() => requireAuth(() => {})}>
                <UserPlus className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* XP Progress Card - Only show for authenticated users */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Level {level}</span>
                <Badge variant="secondary">{xp} XP</Badge>
              </CardTitle>
              <CardDescription>
                {100 - (xp % 100)} XP until next level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(xpProgress)}%</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToGroups}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Study Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {isAuthenticated ? `${groups.length} active groups` : "Join study groups and collaborate"}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToNotes}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notes & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {isAuthenticated ? "Access your study materials" : "Share and access study materials"}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToXP}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {isAuthenticated ? "Track your learning journey" : "Track your learning progress"}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToLeaderboard}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {isAuthenticated ? "See how you rank" : "See top learners and compete"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.slice(0, 3).map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">{group.subject}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/groups/${group.id}`)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                  <Button onClick={handleJoinGroup} className="mt-2">
                    Join a Study Group
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Join the community
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to see your study groups and recent activity
                </p>
                <Button onClick={handleJoinGroup}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {isAuthenticated && <AIChatWidget isOpen={aiOpen} onToggle={handleToggleAI} />}
    </Layout>
  );
}
