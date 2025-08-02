import { useState } from "react";
import { Layout } from "@/components/Layout";
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Clock, 
  Play, 
  Star,
  Zap,
  Brain,
  Code,
  Target,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Scissors,
  Gamepad,
  Volume2,
  Image
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthUser } from "../hooks/useAuthUser";
import { useXP } from "../contexts/XPContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WordRace } from "../components/games/WordRace";
import { QuizDuel } from "../components/games/QuizDuel";
import { FlashcardBattle } from "../components/games/FlashcardBattle";
import { WordDash } from "../components/games/WordDash";
import { SnakeGame } from "../components/games/SnakeGame";
import { GuessTheSound } from "../components/games/GuessTheSound";
import { MemeBuilder } from "../components/games/MemeBuilder";

interface Game {
  id: string;
  name: string;
  description: string;
  category: "single" | "multiplayer" | "coming-soon";
  xpReward: number;
  icon: React.ComponentType<any>;
  color: string;
  status: "available" | "coming-soon";
  players?: number;
  duration?: string;
}

const games: Game[] = [
  {
    id: "word-race",
    name: "Word Race",
    description: "Type words fast based on prompts. Compete with friends in real-time!",
    category: "multiplayer",
    xpReward: 25,
    icon: Zap,
    color: "from-blue-500 to-purple-600",
    status: "available",
    players: 2,
    duration: "2-5 min"
  },
  {
    id: "quiz-duel",
    name: "Quiz Duel",
    description: "Battle friends with quick multiple-choice quizzes. Test your knowledge!",
    category: "multiplayer",
    xpReward: 30,
    icon: Target,
    color: "from-green-500 to-teal-600",
    status: "available",
    players: 2,
    duration: "3-7 min"
  },
  {
    id: "memory-matrix",
    name: "Memory Matrix",
    description: "Tap correct squares in sequence. Train your memory and concentration!",
    category: "single",
    xpReward: 20,
    icon: Brain,
    color: "from-orange-500 to-red-600",
    status: "available",
    duration: "1-3 min"
  },
  {
    id: "code-rush",
    name: "Code Rush",
    description: "Solve code-based puzzles against the clock. Perfect for programmers!",
    category: "coming-soon",
    xpReward: 40,
    icon: Code,
    color: "from-gray-500 to-gray-600",
    status: "coming-soon",
    duration: "5-10 min"
  },
  {
    id: "spin-learn",
    name: "Spin & Learn",
    description: "Spin the wheel, answer a question, and win XP or prizes!",
    category: "single",
    xpReward: 15,
    icon: RotateCcw,
    color: "from-pink-500 to-yellow-400",
    status: "available",
    duration: "1-2 min"
  },
  {
    id: "flashcard-battle",
    name: "Flashcard Battle",
    description: "Battle friends with flashcards! First to answer correctly wins the round.",
    category: "multiplayer",
    xpReward: 35,
    icon: BookOpen,
    color: "from-indigo-500 to-purple-600",
    status: "available",
    players: 2,
    duration: "3-5 min"
  },
  {
    id: "word-dash",
    name: "Word Dash",
    description: "Unscramble letters to form as many words as possible in 60 seconds!",
    category: "single",
    xpReward: 30,
    icon: Scissors,
    color: "from-purple-500 to-pink-600",
    status: "available",
    duration: "1 min"
  },
  {
    id: "snake-game",
    name: "Snake Game",
    description: "Classic snake game with educational letter tiles and fun facts!",
    category: "single",
    xpReward: 25,
    icon: Gamepad,
    color: "from-green-500 to-emerald-600",
    status: "available",
    duration: "2-5 min"
  },
  {
    id: "guess-the-sound",
    name: "Guess the Sound",
    description: "Listen to sounds and identify what they are! Learn about animals, nature, history, and more.",
    category: "single",
    xpReward: 35,
    icon: Volume2,
    color: "from-blue-500 to-purple-600",
    status: "available",
    duration: "3-5 min"
  },
  {
    id: "meme-builder",
    name: "Meme Builder",
    description: "Create educational memes and vote for the funniest ones! Learn while having fun.",
    category: "single",
    xpReward: 40,
    icon: Image,
    color: "from-purple-500 to-pink-600",
    status: "available",
    duration: "5-10 min"
  },
];

const filterOptions = [
  { id: "all", name: "All Games", icon: Gamepad2 },
  { id: "single", name: "Single Player", icon: Users },
  { id: "multiplayer", name: "Multiplayer", icon: Users },
  { id: "coming-soon", name: "Coming Soon", icon: Clock },
];

export default function LettrPlay() {
  const { user, firebaseUser } = useAuthUser();
  const { triggerXPConfetti } = useXP();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);

  const filteredGames = games.filter(game => {
    if (selectedFilter === "all") return true;
    return game.category === selectedFilter;
  });

  const handlePlayGame = (game: Game) => {
    if (game.status === "coming-soon") {
      toast({
        title: "Coming Soon!",
        description: `${game.name} will be available soon. Stay tuned!`,
      });
      return;
    }

    setSelectedGame(game);
    setShowGameModal(true);
  };

  const handleGameComplete = (xpEarned: number) => {
    triggerXPConfetti(xpEarned, "Game XP!");
    toast({
      title: `+${xpEarned} XP Earned!`,
      description: "Great job! You completed the game successfully!",
    });
    setShowGameModal(false);
  };

  const handleGameCancel = () => {
    setShowGameModal(false);
    setSelectedGame(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              LettrPlay 🎮
            </h1>
            <p className="text-muted-foreground">
              Learn while having fun! Play educational games and earn XP.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">{user?.xp || 0} XP</span>
              </div>
              <p className="text-sm text-muted-foreground">Total earned</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <filter.icon className="w-4 h-4" />
              {filter.name}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <Card 
              key={game.id} 
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className={`h-32 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                <game.icon className="w-12 h-12 text-white" />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{game.name}</CardTitle>
                  <Badge 
                    variant={game.status === "coming-soon" ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {game.status === "coming-soon" ? "Soon" : `${game.xpReward} XP`}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {game.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Game Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {game.category === "multiplayer" ? (
                        <Users className="w-3 h-3" />
                      ) : game.category === "single" ? (
                        <Users className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>
                        {game.category === "multiplayer" 
                          ? `${game.players} players`
                          : game.category === "single"
                          ? "Single player"
                          : "Coming soon"
                        }
                      </span>
                    </div>
                    {game.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{game.duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Play Button */}
                  <Button
                    onClick={() => handlePlayGame(game)}
                    className={cn(
                      "w-full",
                      game.status === "coming-soon" 
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    )}
                    disabled={game.status === "coming-soon"}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {game.status === "coming-soon" ? "Coming Soon" : "Play Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leaderboard Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Players
            </CardTitle>
            <CardDescription>
              See who's dominating the leaderboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Alex Chen", xp: 1250, game: "Word Race" },
                { name: "Sarah Kim", xp: 980, game: "Quiz Duel" },
                { name: "Mike Johnson", xp: 750, game: "Memory Matrix" },
              ].map((player, index) => (
                <div key={player.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      index === 0 ? "bg-yellow-500" : 
                      index === 1 ? "bg-gray-400" : 
                      "bg-orange-500"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">{player.game}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{player.xp} XP</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Modal */}
      {showGameModal && selectedGame && (
        <GameModal
          game={selectedGame}
          onComplete={handleGameComplete}
          onCancel={handleGameCancel}
        />
      )}
    </Layout>
  );
}

interface GameModalProps {
  game: Game;
  onComplete: (xpEarned: number) => void;
  onCancel: () => void;
}

function GameModal({ game, onComplete, onCancel }: GameModalProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "completed">("waiting");
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);

  const startGame = () => {
    setGameState("playing");
    // Simulate game timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleComplete = () => {
    onComplete(game.xpReward);
  };

  const handleWordRaceComplete = (score: number, xpEarned: number) => {
    onComplete(xpEarned);
  };

  const handleQuizDuelComplete = (won: boolean, xp: number) => {
    onComplete(xp);
  };

  const handleFlashcardBattleComplete = (won: boolean, xp: number) => {
    onComplete(xp);
  };

  const handleWordDashComplete = (score: number, xpEarned: number) => {
    onComplete(xpEarned);
  };

  const handleSnakeGameComplete = (score: number, xpEarned: number) => {
    onComplete(xpEarned);
  };

  const handleGuessTheSoundComplete = (score: number, xpEarned: number) => {
    onComplete(xpEarned);
  };

  const handleMemeBuilderComplete = (score: number, xpEarned: number) => {
    onComplete(xpEarned);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {game.id === "word-race" ? (
            <WordRace onComplete={handleWordRaceComplete} onCancel={onCancel} />
          ) : game.id === "quiz-duel" ? (
            <QuizDuel onComplete={handleQuizDuelComplete} onCancel={onCancel} />
          ) : game.id === "flashcard-battle" ? (
            <FlashcardBattle onComplete={handleFlashcardBattleComplete} onCancel={onCancel} />
          ) : game.id === "word-dash" ? (
            <WordDash onComplete={handleWordDashComplete} onCancel={onCancel} />
          ) : game.id === "snake-game" ? (
            <SnakeGame onComplete={handleSnakeGameComplete} onCancel={onCancel} />
          ) : game.id === "guess-the-sound" ? (
            <GuessTheSound onComplete={handleGuessTheSoundComplete} onCancel={onCancel} />
          ) : game.id === "meme-builder" ? (
            <MemeBuilder onComplete={handleMemeBuilderComplete} onCancel={onCancel} />
          ) : game.id === "spin-learn" ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 flex items-center justify-center mb-6 animate-spin-slow">
                <RotateCcw className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Spin & Learn</h2>
              <p className="text-muted-foreground mb-4">Spin the wheel to get a question and win rewards!</p>
              <Button disabled>Coming Soon</Button>
              <Button variant="outline" onClick={onCancel} className="mt-2">Back to Games</Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-full flex items-center justify-center mx-auto`}>
                <game.icon className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold">{game.name}</h2>
              
              {gameState === "waiting" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Get ready to play! Earn {game.xpReward} XP for completing this game.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={startGame} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {gameState === "playing" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{timeLeft}s</p>
                    <p className="text-sm text-muted-foreground">Time remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{score}</p>
                    <p className="text-sm text-muted-foreground">Score</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-center text-muted-foreground">
                      Game simulation in progress...
                    </p>
                  </div>
                </div>
              )}

              {gameState === "completed" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">Game Complete!</p>
                    <p className="text-lg">Final Score: {score}</p>
                  </div>
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <p className="text-center text-green-600 font-semibold">
                      +{game.xpReward} XP Earned!
                    </p>
                  </div>
                  <Button onClick={handleComplete} className="w-full">
                    Collect Reward
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 