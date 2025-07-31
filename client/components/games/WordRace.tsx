import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Timer, Target, Zap } from "lucide-react";

interface WordRaceProps {
  onComplete: (score: number, xpEarned: number) => void;
  onCancel: () => void;
}

const wordPrompts = [
  "Type a word that starts with 'A'",
  "Type a word that ends with 'E'",
  "Type a word with 4 letters",
  "Type a word that rhymes with 'cat'",
  "Type a word that means 'happy'",
  "Type a word that is a color",
  "Type a word that is an animal",
  "Type a word that is a fruit",
  "Type a word that is a number",
  "Type a word that is a verb"
];

export function WordRace({ onComplete, onCancel }: WordRaceProps) {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<"waiting" | "playing" | "completed">("waiting");
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);

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

  const startGame = () => {
    setGameState("playing");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Simple scoring logic - any word counts as correct for demo
    const isCorrect = userInput.trim().length > 0;
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => [...prev, userInput.trim()]);
    } else {
      setWrongAnswers(prev => [...prev, userInput.trim()]);
    }

    setUserInput("");
    setCurrentPrompt(prev => (prev + 1) % wordPrompts.length);
  };

  const handleComplete = () => {
    const xpEarned = Math.floor(score / 10) * 5; // 5 XP per 10 points
    onComplete(score, xpEarned);
  };

  return (
    <div className="space-y-6">
      {gameState === "waiting" && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Word Race</h2>
          <p className="text-muted-foreground">
            Type words as fast as you can based on the prompts. Earn XP for speed and accuracy!
          </p>
          <div className="flex gap-3">
            <Button onClick={startGame} className="flex-1">
              <Zap className="w-4 h-4 mr-2" />
              Start Race
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
              <Badge variant="secondary">
                <Timer className="w-3 h-3 mr-1" />
                {timeLeft}s
              </Badge>
              <Badge variant="default">
                <Target className="w-3 h-3 mr-1" />
                {score} pts
              </Badge>
            </div>
            <Badge variant="outline">
              Round {currentPrompt + 1}/10
            </Badge>
          </div>

          {/* Current Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">
                {wordPrompts[currentPrompt]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your word here..."
                  className="text-center text-lg"
                  autoFocus
                />
                <Button type="submit" className="w-full">
                  Submit Word
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">Correct</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{correctAnswers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">Wrong</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{wrongAnswers.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {gameState === "completed" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-600">Race Complete!</h2>
            <p className="text-muted-foreground">Great job!</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{score}</p>
              <p className="text-sm text-muted-foreground">Final Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{correctAnswers.length}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{wrongAnswers.length}</p>
              <p className="text-sm text-muted-foreground">Wrong</p>
            </div>
          </div>

          <div className="bg-green-500/10 p-4 rounded-lg">
            <p className="text-center text-green-600 font-semibold">
              +{Math.floor(score / 10) * 5} XP Earned!
            </p>
          </div>

          <Button onClick={handleComplete} className="w-full">
            Collect Reward
          </Button>
        </div>
      )}
    </div>
  );
} 