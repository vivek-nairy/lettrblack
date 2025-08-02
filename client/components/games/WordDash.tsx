import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Timer, Target, Zap, Users, Play, RotateCcw, Check, X } from "lucide-react";
import { 
  getRandomScrambleWord, 
  scrambleWord, 
  isValidWord, 
  canFormWord, 
  calculateWordScore 
} from "@/lib/word-utils";

interface WordDashProps {
  onComplete: (score: number, xpEarned: number) => void;
  onCancel: () => void;
}

interface GameMode {
  id: "solo" | "multiplayer";
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

const gameModes: GameMode[] = [
  {
    id: "solo",
    name: "Solo Mode",
    description: "Play alone and beat your own records",
    icon: Target
  },
  {
    id: "multiplayer",
    name: "VS Friend",
    description: "Challenge a friend to a word battle",
    icon: Users
  }
];

export function WordDash({ onComplete, onCancel }: WordDashProps) {
  const [gameState, setGameState] = useState<"mode-select" | "waiting" | "playing" | "completed">("mode-select");
  const [selectedMode, setSelectedMode] = useState<"solo" | "multiplayer" | null>(null);
  const [scrambledWord, setScrambledWord] = useState("");
  const [originalWord, setOriginalWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<"solo" | "multiplayer">("solo");
  const [opponentScore, setOpponentScore] = useState(0);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState("completed");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  const startNewGame = () => {
    const word = getRandomScrambleWord();
    setOriginalWord(word);
    setScrambledWord(scrambleWord(word));
    setScore(0);
    setTimeLeft(60);
    setFoundWords([]);
    setInvalidWords([]);
    setUserInput("");
    setGameState("playing");
  };

  const handleModeSelect = (mode: "solo" | "multiplayer") => {
    setGameMode(mode);
    setSelectedMode(mode);
    if (mode === "solo") {
      setGameState("waiting");
    } else {
      // For multiplayer, we'd implement friend invitation logic here
      setGameState("waiting");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const word = userInput.trim().toLowerCase();
    
    // Check if word was already found
    if (foundWords.includes(word)) {
      setInvalidWords(prev => [...prev, word]);
      setUserInput("");
      return;
    }

    // Check if word can be formed from scrambled letters
    if (!canFormWord(word, scrambledWord)) {
      setInvalidWords(prev => [...prev, word]);
      setUserInput("");
      return;
    }

    // Check if word is valid
    if (!isValidWord(word)) {
      setInvalidWords(prev => [...prev, word]);
      setUserInput("");
      return;
    }

    // Valid word found!
    const wordScore = calculateWordScore(word);
    setScore(prev => prev + wordScore);
    setFoundWords(prev => [...prev, word]);
    setUserInput("");
  };

  const handleComplete = () => {
    const xpEarned = Math.floor(score / 5) * 3; // 3 XP per 5 points
    onComplete(score, xpEarned);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {gameState === "mode-select" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Word Dash</h2>
          <p className="text-muted-foreground">
            Unscramble letters to form as many words as possible in 60 seconds!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameModes.map((mode) => (
              <Card 
                key={mode.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleModeSelect(mode.id)}
              >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <mode.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{mode.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <Button variant="outline" onClick={onCancel}>
            Back to Games
          </Button>
        </div>
      )}

      {gameState === "waiting" && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Word Dash - {selectedMode === "solo" ? "Solo" : "Multiplayer"}</h2>
          <p className="text-muted-foreground">
            {selectedMode === "solo" 
              ? "Get ready to unscramble letters and form words!" 
              : "Waiting for opponent to join..."
            }
          </p>
          <div className="flex gap-3">
            <Button onClick={startNewGame} className="flex-1">
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
        <div className="space-y-6">
          {/* Game Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Timer className="w-4 h-4 mr-2" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="default" className="text-lg px-3 py-1">
                <Target className="w-4 h-4 mr-2" />
                {score} pts
              </Badge>
            </div>
            {gameMode === "multiplayer" && (
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                Opponent: {opponentScore} pts
              </Badge>
            )}
          </div>

          {/* Scrambled Letters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">Scrambled Letters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2 mb-6">
                {scrambledWord.split('').map((letter, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  >
                    {letter.toUpperCase()}
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a word..."
                  className="text-center text-lg"
                  maxLength={8}
                />
                <Button type="submit" className="w-full">
                  Submit Word
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Game Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Found Words ({foundWords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {foundWords.map((word, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {word} (+{calculateWordScore(word)})
                    </Badge>
                  ))}
                  {foundWords.length === 0 && (
                    <p className="text-muted-foreground text-sm">No words found yet...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Invalid Words ({invalidWords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {invalidWords.map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs text-red-600">
                      {word}
                    </Badge>
                  ))}
                  {invalidWords.length === 0 && (
                    <p className="text-muted-foreground text-sm">No invalid words yet...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoring Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scoring Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-bold">3 letters</p>
                  <p className="text-muted-foreground">1 point</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">4-5 letters</p>
                  <p className="text-muted-foreground">2-3 points</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">6+ letters</p>
                  <p className="text-muted-foreground">5+ points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState === "completed" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-600">Time's Up!</h2>
            <p className="text-muted-foreground">Great job finding words!</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{score}</p>
              <p className="text-sm text-muted-foreground">Final Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{foundWords.length}</p>
              <p className="text-sm text-muted-foreground">Words Found</p>
            </div>
          </div>

          {gameMode === "multiplayer" && (
            <div className="bg-blue-500/10 p-4 rounded-lg">
              <p className="text-center text-blue-600 font-semibold">
                {score > opponentScore ? "You Won! 🎉" : 
                 score < opponentScore ? "Opponent Won 😔" : 
                 "It's a Tie! 🤝"}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Opponent Score: {opponentScore}
              </p>
            </div>
          )}

          <div className="bg-green-500/10 p-4 rounded-lg">
            <p className="text-center text-green-600 font-semibold">
              +{Math.floor(score / 5) * 3} XP Earned!
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleComplete} className="flex-1">
              Collect Reward
            </Button>
            <Button variant="outline" onClick={startNewGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 