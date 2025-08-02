import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Target, Zap, Info } from "lucide-react";

interface SnakeGameProps {
  onComplete: (score: number, xpEarned: number) => void;
  onCancel: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Food {
  position: Position;
  letter: string;
  color: string;
}

interface GameState {
  snake: Position[];
  food: Food | null;
  direction: string;
  score: number;
  xp: number;
  gameOver: boolean;
  paused: boolean;
  fact: string;
  showFact: boolean;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 150;

// Educational facts for each letter
const letterFacts: Record<string, string> = {
  A: "A is the first letter of the alphabet and appears in about 8.2% of all English words!",
  B: "B is the second letter and represents the voiced bilabial stop sound.",
  C: "C can make both 'k' and 's' sounds, making it one of the most versatile letters!",
  D: "D is the fourth letter and appears in about 4.3% of English words.",
  E: "E is the most frequently used letter in English, appearing in about 12% of words!",
  F: "F represents the voiceless labiodental fricative sound.",
  G: "G can make both hard (go) and soft (gem) sounds in English.",
  H: "H is the eighth letter and is often silent in words like 'hour' and 'honor'.",
  I: "I is the ninth letter and is the shortest word in English when used as a pronoun.",
  J: "J is the tenth letter and was the last letter added to the English alphabet.",
  K: "K represents the voiceless velar plosive sound.",
  L: "L is the twelfth letter and appears in about 4% of English words.",
  M: "M represents the voiced bilabial nasal sound.",
  N: "N is the fourteenth letter and appears in about 6.7% of English words.",
  O: "O is the fifteenth letter and is the third most common vowel in English.",
  P: "P represents the voiceless bilabial plosive sound.",
  Q: "Q is almost always followed by U in English words.",
  R: "R is the eighteenth letter and appears in about 6% of English words.",
  S: "S is the nineteenth letter and is the most common letter at the end of English words.",
  T: "T is the twentieth letter and appears in about 9.1% of English words.",
  U: "U is the twenty-first letter and is the second most common vowel.",
  V: "V represents the voiced labiodental fricative sound.",
  W: "W is called 'double-u' because it was originally written as two U's.",
  X: "X is the twenty-fourth letter and represents the voiceless velar fricative sound.",
  Y: "Y is sometimes considered a vowel and sometimes a consonant.",
  Z: "Z is the last letter of the alphabet and is called 'zee' in American English."
};

// Color palette for letters
const letterColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2",
  "#F9E79F", "#ABEBC6", "#FAD7A0", "#AED6F1", "#D5A6BD",
  "#F7DC6F", "#A9CCE3", "#F8C471", "#D2B4DE", "#85C1E9",
  "#F9E79F", "#ABEBC6"
];

export function SnakeGame({ onComplete, onCancel }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: null,
    direction: "right",
    score: 0,
    xp: 0,
    gameOver: false,
    paused: false,
    fact: "",
    showFact: false
  });
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  // Initialize game
  const initGame = useCallback(() => {
    const newFood = generateFood();
    setGameState({
      snake: [{ x: 10, y: 10 }],
      food: newFood,
      direction: "right",
      score: 0,
      xp: 0,
      gameOver: false,
      paused: false,
      fact: "",
      showFact: false
    });
    setGameStarted(true);
  }, []);

  // Generate random food with letter
  const generateFood = (): Food => {
    const letters = Object.keys(letterFacts);
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const colorIndex = randomLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
    
    return {
      position: {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      },
      letter: randomLetter,
      color: letterColors[colorIndex % letterColors.length]
    };
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameState.gameOver) return;

      switch (e.key) {
        case "ArrowUp":
          if (gameState.direction !== "down") {
            setGameState(prev => ({ ...prev, direction: "up" }));
          }
          break;
        case "ArrowDown":
          if (gameState.direction !== "up") {
            setGameState(prev => ({ ...prev, direction: "down" }));
          }
          break;
        case "ArrowLeft":
          if (gameState.direction !== "right") {
            setGameState(prev => ({ ...prev, direction: "left" }));
          }
          break;
        case "ArrowRight":
          if (gameState.direction !== "left") {
            setGameState(prev => ({ ...prev, direction: "right" }));
          }
          break;
        case " ":
          e.preventDefault();
          setGameState(prev => ({ ...prev, paused: !prev.paused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, gameState.direction, gameState.gameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameState.gameOver || gameState.paused) return;

    const gameLoop = () => {
      setGameState(prev => {
        const newSnake = [...prev.snake];
        const head = { ...newSnake[0] };

        // Move head based on direction
        switch (prev.direction) {
          case "up":
            head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
            break;
          case "down":
            head.y = (head.y + 1) % GRID_SIZE;
            break;
          case "left":
            head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
            break;
          case "right":
            head.x = (head.x + 1) % GRID_SIZE;
            break;
        }

        // Check collision with self
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          return { ...prev, gameOver: true };
        }

        newSnake.unshift(head);

        // Check if food is eaten
        if (prev.food && head.x === prev.food.position.x && head.y === prev.food.position.y) {
          const newScore = prev.score + 10;
          const newXp = prev.xp + 5;
          const newFood = generateFood();
          const fact = letterFacts[prev.food.letter];
          
          return {
            ...prev,
            snake: newSnake,
            food: newFood,
            score: newScore,
            xp: newXp,
            fact,
            showFact: true
          };
        } else {
          newSnake.pop();
          return {
            ...prev,
            snake: newSnake
          };
        }
      });
    };

    gameLoopRef.current = setInterval(gameLoop, GAME_SPEED);
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameState.gameOver, gameState.paused]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    ctx.fillStyle = "#4ade80";
    gameState.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = "#22c55e";
      } else {
        // Body
        ctx.fillStyle = "#4ade80";
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    // Draw food
    if (gameState.food) {
      ctx.fillStyle = gameState.food.color;
      ctx.fillRect(
        gameState.food.position.x * CELL_SIZE + 2,
        gameState.food.position.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );

      // Draw letter
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        gameState.food.letter,
        gameState.food.position.x * CELL_SIZE + CELL_SIZE / 2,
        gameState.food.position.y * CELL_SIZE + CELL_SIZE / 2
      );
    }
  }, [gameState.snake, gameState.food]);

  // Hide fact after 3 seconds
  useEffect(() => {
    if (gameState.showFact) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, showFact: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.showFact]);

  const handleComplete = () => {
    const xpEarned = Math.floor(gameState.xp / 5) * 3; // 3 XP per 5 points
    onComplete(gameState.score, xpEarned);
  };

  const resetGame = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    setGameStarted(false);
    setGameState({
      snake: [{ x: 10, y: 10 }],
      food: null,
      direction: "right",
      score: 0,
      xp: 0,
      gameOver: false,
      paused: false,
      fact: "",
      showFact: false
    });
  };

  return (
    <div className="space-y-6">
      {!gameStarted && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Snake Game</h2>
          <p className="text-muted-foreground">
            Collect letter tiles to earn XP and learn fun facts! Use arrow keys to control the snake.
          </p>
          <div className="flex gap-3">
            <Button onClick={initGame} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {gameStarted && (
        <div className="space-y-4">
          {/* Game Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <Target className="w-3 h-3 mr-1" />
                Score: {gameState.score}
              </Badge>
              <Badge variant="default">
                <Zap className="w-3 h-3 mr-1" />
                XP: {gameState.xp}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {gameState.paused && (
                <Badge variant="outline">PAUSED</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGameState(prev => ({ ...prev, paused: !prev.paused }))}
              >
                {gameState.paused ? "Resume" : "Pause"}
              </Button>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="flex justify-center">
            <Card className="p-4">
              <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                className="border border-gray-300 rounded-lg"
              />
            </Card>
          </div>

          {/* Controls Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-bold">Arrow Keys</p>
                  <p className="text-muted-foreground">Move Snake</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">Spacebar</p>
                  <p className="text-muted-foreground">Pause/Resume</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fact Display */}
          {gameState.showFact && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Fun Fact about "{gameState.fact.split(' ')[0]}"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">{gameState.fact}</p>
              </CardContent>
            </Card>
          )}

          {/* Game Over */}
          {gameState.gameOver && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-red-600">Game Over!</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{gameState.score}</p>
                  <p className="text-sm text-muted-foreground">Final Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{gameState.xp}</p>
                  <p className="text-sm text-muted-foreground">XP Earned</p>
                </div>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg">
                <p className="text-center text-green-600 font-semibold">
                  +{Math.floor(gameState.xp / 5) * 3} XP Earned!
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleComplete} className="flex-1">
                  Collect Reward
                </Button>
                <Button variant="outline" onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 