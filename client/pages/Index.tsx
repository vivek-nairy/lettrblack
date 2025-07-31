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
} from "lucide-react";
import { getGroupsByUser, getProgressByUser } from "@/lib/firestore-utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useXPConfetti } from "../hooks/useXPConfetti";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AIChatWidget } from "../components/AIChatWidget";

export function Index() {
  const { user, firebaseUser } = useAuthUser();
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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.name || firebaseUser?.displayName || "Student"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your learning journey?
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">{streak} day streak</span>
              </div>
              <p className="text-sm text-muted-foreground">Keep it up!</p>
            </div>
          </div>
        </div>

        {/* XP Progress Card */}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/groups")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Study Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {groups.length} active groups
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/notes")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notes & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Access your study materials
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/xp")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Track your learning journey
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/leaderboard")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                See how you rank
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
            {groups.length > 0 ? (
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
                <Button onClick={() => navigate("/groups")} className="mt-2">
                  Join a Study Group
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AIChatWidget isOpen={aiOpen} onToggle={() => setAiOpen((v) => !v)} />
    </Layout>
  );
}
