import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Timer, User, Users } from "lucide-react";

const mockQuestions = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "London", "Paris", "Madrid"],
    answer: 2,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: 1,
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Shakespeare", "Dickens", "Austen", "Hemingway"],
    answer: 0,
  },
  {
    question: "What is 9 x 7?",
    options: ["56", "63", "72", "49"],
    answer: 1,
  },
  {
    question: "Which gas do plants absorb?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    answer: 2,
  },
];

interface QuizDuelProps {
  onComplete: (won: boolean, xp: number) => void;
  onCancel: () => void;
}

export function QuizDuel({ onComplete, onCancel }: QuizDuelProps) {
  const [current, setCurrent] = useState(0);
  const [myAnswers, setMyAnswers] = useState<number[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<number[]>([]);
  const [timer, setTimer] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate opponent answers (random, but always within time)
  useEffect(() => {
    if (gameState === 'playing') {
      const simulated = mockQuestions.map(q => Math.floor(Math.random() * q.options.length));
      setOpponentAnswers(simulated);
    }
  }, [gameState]);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timer <= 0) {
      finishGame();
      return;
    }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [timer, gameState]);

  // Handle answer selection
  const handleAnswer = (idx: number) => {
    if (myAnswers.length > current) return;
    setMyAnswers(prev => [...prev, idx]);
    setTimeout(() => {
      if (current < mockQuestions.length - 1) {
        setCurrent(c => c + 1);
      } else {
        finishGame();
      }
    }, 400);
  };

  // Calculate scores and finish
  const finishGame = () => {
    let my = 0, opp = 0;
    for (let i = 0; i < mockQuestions.length; i++) {
      if (myAnswers[i] === mockQuestions[i].answer) my++;
      if (opponentAnswers[i] === mockQuestions[i].answer) opp++;
    }
    setMyScore(my);
    setOpponentScore(opp);
    setGameState('result');
  };

  // XP logic: 30 XP for win, 15 for tie, 10 for loss
  const getXP = () => {
    if (myScore > opponentScore) return 30;
    if (myScore === opponentScore) return 15;
    return 10;
  };

  // Result screen
  if (gameState === 'result') {
    const won = myScore > opponentScore;
    const tie = myScore === opponentScore;
    return (
      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <User className="w-8 h-8 text-primary" />
          <span className="font-bold text-2xl">{myScore}</span>
          <span className="text-lg text-muted-foreground">vs</span>
          <User className="w-8 h-8 text-gray-400" />
          <span className="font-bold text-2xl">{opponentScore}</span>
        </div>
        <div>
          {won && <p className="text-2xl font-bold text-green-600">You Win! 🎉</p>}
          {tie && <p className="text-2xl font-bold text-yellow-500">It's a Tie!</p>}
          {!won && !tie && <p className="text-2xl font-bold text-red-500">You Lost, Try Again!</p>}
        </div>
        <div className="bg-green-500/10 p-4 rounded-lg">
          <p className="text-center text-green-600 font-semibold">
            +{getXP()} XP Earned!
          </p>
        </div>
        <Button onClick={() => onComplete(won, getXP())} className="w-full">
          Collect Reward
        </Button>
        <Button variant="outline" onClick={onCancel} className="w-full mt-2">
          Back to Games
        </Button>
      </div>
    );
  }

  // Main quiz UI
  const q = mockQuestions[current];
  return (
    <div className="space-y-6">
      {/* Timer and Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          <Timer className="w-4 h-4 mr-1" />
          {timer}s
        </Badge>
        <Badge variant="default">
          Question {current + 1}/5
        </Badge>
      </div>
      {/* Split screen progress */}
      <div className="flex gap-2 items-center justify-center">
        <div className="flex flex-col items-center">
          <User className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">{myAnswers.length}</span>
        </div>
        <div className="h-8 w-0.5 bg-muted mx-2" />
        <div className="flex flex-col items-center">
          <User className="w-6 h-6 text-gray-400" />
          <span className="text-lg font-bold">{opponentAnswers.slice(0, current + 1).filter((a, i) => a === mockQuestions[i].answer).length}</span>
        </div>
      </div>
      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-center">{q.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, idx) => (
              <Button
                key={idx}
                variant={myAnswers.length > current ? "outline" : "default"}
                className="w-full"
                disabled={myAnswers.length > current}
                onClick={() => handleAnswer(idx)}
              >
                {opt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
  );
}