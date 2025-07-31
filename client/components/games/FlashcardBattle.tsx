import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, Timer, User, Users, CheckCircle, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock flashcard data
const mockFlashcards = [
  {
    id: 1,
    term: "Photosynthesis",
    definition: "The process by which plants convert sunlight into energy",
    category: "Science"
  },
  {
    id: 2,
    term: "Democracy",
    definition: "A system of government by the whole population through elected representatives",
    category: "History"
  },
  {
    id: 3,
    term: "Algorithm",
    definition: "A step-by-step procedure for solving a problem or accomplishing a task",
    category: "Technology"
  },
  {
    id: 4,
    term: "Metaphor",
    definition: "A figure of speech that compares two things without using 'like' or 'as'",
    category: "Language"
  },
  {
    id: 5,
    term: "Pythagorean Theorem",
    definition: "In a right triangle, the square of the hypotenuse equals the sum of squares of other two sides",
    category: "Math"
  }
];

interface FlashcardBattleProps {
  onComplete: (won: boolean, xp: number) => void;
  onCancel: () => void;
}

export function FlashcardBattle({ onComplete, onCancel }: FlashcardBattleProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'round-result' | 'final-result'>('waiting');
  const [currentFlashcard, setCurrentFlashcard] = useState(mockFlashcards[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [roundWinner, setRoundWinner] = useState<'me' | 'opponent' | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [lastAnswer, setLastAnswer] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const TOTAL_ROUNDS = 5;

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - opponent wins by default
            handleRoundEnd('opponent');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    // Simulate opponent answering randomly
    if (gameState === 'playing' && timeLeft > 0) {
      const opponentAnswerTime = Math.random() * 10 + 3; // 3-13 seconds
      const opponentTimer = setTimeout(() => {
        if (gameState === 'playing' && roundWinner === null) {
          const isCorrect = Math.random() > 0.4; // 60% chance of correct answer
          if (isCorrect) {
            handleRoundEnd('opponent');
          }
        }
      }, opponentAnswerTime * 1000);

      return () => clearTimeout(opponentTimer);
    }
  }, [gameState, timeLeft, roundWinner]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(15);
    setCurrentFlashcard(mockFlashcards[0]);
    setIsFlipped(false);
    setAnswer('');
    setRoundWinner(null);
    setBuzzerActive(false);
    setLastAnswer('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRoundEnd = (winner: 'me' | 'opponent') => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setRoundWinner(winner);
    setGameState('round-result');
    
    if (winner === 'me') {
      setMyScore(prev => prev + 1);
    } else {
      setOpponentScore(prev => prev + 1);
    }
  };

  const handleAnswerSubmit = () => {
    if (!answer.trim()) return;
    
    setLastAnswer(answer);
    setBuzzerActive(true);
    
    // Check if answer is correct (simple contains check)
    const isCorrect = currentFlashcard.definition.toLowerCase().includes(answer.toLowerCase()) ||
                     currentFlashcard.term.toLowerCase().includes(answer.toLowerCase());
    
    if (isCorrect) {
      handleRoundEnd('me');
    } else {
      // Wrong answer - opponent gets a chance
      setTimeout(() => {
        if (gameState === 'playing' && roundWinner === null) {
          // Simulate opponent answering correctly
          handleRoundEnd('opponent');
        }
      }, 1000);
    }
  };

  const nextRound = () => {
    if (currentRound >= TOTAL_ROUNDS) {
      // Game over
      const finalWinner = myScore > opponentScore ? 'me' : 'opponent';
      const xpEarned = finalWinner === 'me' ? 35 : 10;
      onComplete(finalWinner === 'me', xpEarned);
      return;
    }

    setCurrentRound(prev => prev + 1);
    setCurrentFlashcard(mockFlashcards[currentRound]);
    setIsFlipped(false);
    setAnswer('');
    setRoundWinner(null);
    setTimeLeft(15);
    setGameState('playing');
    setBuzzerActive(false);
    setLastAnswer('');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  if (gameState === 'waiting') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Flashcard Battle</h2>
          <p className="text-muted-foreground mb-6">
            Battle your friend with flashcards! First to answer correctly wins the round.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Opponent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">0</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              • 5 rounds total<br/>
              • 15 seconds per round<br/>
              • First correct answer wins
            </p>
            <div className="flex gap-3">
              <Button onClick={startGame} className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Start Battle
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Round {currentRound}/{TOTAL_ROUNDS}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">You: {myScore}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">Opponent: {opponentScore}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              timeLeft <= 5 ? "text-red-500" : "text-primary"
            )}>
              {timeLeft}s
            </div>
            <p className="text-xs text-muted-foreground">Time Left</p>
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative">
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-500 transform perspective-1000",
              isFlipped ? "rotate-y-180" : ""
            )}
            onClick={flipCard}
          >
            <CardContent className="p-8 text-center min-h-[200px] flex items-center justify-center">
              {!isFlipped ? (
                <div>
                  <Badge variant="secondary" className="mb-2">{currentFlashcard.category}</Badge>
                  <h3 className="text-xl font-bold">{currentFlashcard.term}</h3>
                  <p className="text-sm text-muted-foreground mt-2">Click to see definition</p>
                </div>
              ) : (
                <div>
                  <Badge variant="secondary" className="mb-2">{currentFlashcard.category}</Badge>
                  <p className="text-lg">{currentFlashcard.definition}</p>
                  <p className="text-sm text-muted-foreground mt-2">Click to flip back</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Answer Input */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
              disabled={buzzerActive}
              className="flex-1"
            />
            <Button 
              onClick={handleAnswerSubmit}
              disabled={!answer.trim() || buzzerActive}
              className={cn(
                buzzerActive && "animate-pulse bg-green-500"
              )}
            >
              {buzzerActive ? <CheckCircle className="w-4 h-4" /> : "Submit"}
            </Button>
          </div>
          
          {buzzerActive && (
            <div className="text-center">
              <p className="text-sm font-medium text-green-600">
                {lastAnswer} - Checking answer...
              </p>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel Game
        </Button>
      </div>
    );
  }

  if (gameState === 'round-result') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            roundWinner === 'me' ? "bg-green-500" : "bg-red-500"
          )}>
            {roundWinner === 'me' ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <XCircle className="w-8 h-8 text-white" />
            )}
          </div>
          
          <h3 className="text-xl font-bold mb-2">
            {roundWinner === 'me' ? 'You Won!' : 'Opponent Won!'}
          </h3>
          
          <p className="text-muted-foreground mb-4">
            Round {currentRound} Complete
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{myScore}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Opponent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{opponentScore}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {currentRound < TOTAL_ROUNDS ? (
            <Button onClick={nextRound} className="w-full">
              Next Round
            </Button>
          ) : (
            <Button onClick={nextRound} className="w-full">
              See Final Results
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel Game
          </Button>
        </div>
      </div>
    );
  }

  return null;
} 