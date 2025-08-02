import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sword, 
  Users, 
  Target, 
  Zap, 
  RotateCcw, 
  Check, 
  X, 
  Trophy,
  Crown,
  Clock,
  AlertTriangle,
  Play,
  Users2,
  Timer
} from "lucide-react";
import { useAuthUser } from "../../hooks/useAuthUser";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface MiniBattleRoyaleProps {
  onComplete: (score: number, xpEarned: number) => void;
  onCancel: () => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category: "science" | "history" | "math" | "literature" | "geography";
}

interface Player {
  id: string;
  name: string;
  isAlive: boolean;
  eliminatedInRound?: number;
  correctAnswers: number;
  totalAnswers: number;
  joinedAt: Date;
}

interface GameState {
  gamePhase: "lobby" | "waiting" | "playing" | "elimination" | "winner" | "completed";
  currentRound: number;
  timeLeft: number;
  currentQuestion: QuizQuestion | null;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  eliminatedPlayers: string[];
  winner: Player | null;
  score: number;
  xp: number;
}

interface LobbyState {
  lobbyId: string | null;
  players: Player[];
  maxPlayers: number;
  minPlayers: number;
  gameStarted: boolean;
  currentRound: number;
  roundResults: { playerId: string; answer: string; correct: boolean; eliminated: boolean }[];
  roundTimer: number;
}

// Sample quiz questions
const quizQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "What is the chemical symbol for gold?",
    options: ["Au", "Ag", "Fe", "Cu"],
    correctAnswer: "Au",
    category: "science"
  },
  {
    id: "2",
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: "1945",
    category: "history"
  },
  {
    id: "3",
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: "12",
    category: "math"
  },
  {
    id: "4",
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare",
    category: "literature"
  },
  {
    id: "5",
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correctAnswer: "Tokyo",
    category: "geography"
  }
];

const ROUND_TIME = 10;
const XP_PER_CORRECT = 10;
const XP_WINNER_BONUS = 100;
const XP_PARTICIPATION = 5;

export function MiniBattleRoyale({ onComplete, onCancel }: MiniBattleRoyaleProps) {
  const { user, firebaseUser } = useAuthUser();
  const [lobbyState, setLobbyState] = useState<LobbyState>({
    lobbyId: null,
    players: [],
    maxPlayers: 10,
    minPlayers: 3,
    gameStarted: false,
    currentRound: 0,
    roundResults: [],
    roundTimer: ROUND_TIME
  });
  const [gameState, setGameState] = useState<GameState>({
    gamePhase: "lobby",
    currentRound: 0,
    timeLeft: ROUND_TIME,
    currentQuestion: null,
    selectedAnswer: null,
    isCorrect: null,
    eliminatedPlayers: [],
    winner: null,
    score: 0,
    xp: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const createLobby = async () => {
    if (!firebaseUser) return;
    
    const lobbyId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lobbyRef = doc(db, "battleRoyaleLobbies", lobbyId);
    
    const newPlayer: Player = {
      id: firebaseUser.uid,
      name: (user as any)?.displayName || "Player",
      isAlive: true,
      correctAnswers: 0,
      totalAnswers: 0,
      joinedAt: new Date()
    };
    
    await setDoc(lobbyRef, {
      hostId: firebaseUser.uid,
      players: [newPlayer],
      maxPlayers: 10,
      minPlayers: 3,
      gameStarted: false,
      currentRound: 0,
      roundResults: [],
      roundTimer: ROUND_TIME,
      createdAt: new Date()
    });

    setLobbyState(prev => ({
      ...prev,
      lobbyId,
      players: [newPlayer]
    }));
  };

  const joinLobby = async (lobbyId: string) => {
    if (!firebaseUser) return;
    
    const lobbyRef = doc(db, "battleRoyaleLobbies", lobbyId);
    const newPlayer: Player = {
      id: firebaseUser.uid,
      name: (user as any)?.displayName || "Player",
      isAlive: true,
      correctAnswers: 0,
      totalAnswers: 0,
      joinedAt: new Date()
    };
    
    await updateDoc(lobbyRef, {
      players: [...lobbyState.players, newPlayer]
    });

    setLobbyState(prev => ({
      ...prev,
      lobbyId,
      players: [...prev.players, newPlayer]
    }));
  };

  const handleComplete = () => {
    const totalXP = gameState.xp + Math.floor(gameState.score / 10) * 5;
    onComplete(gameState.score, totalXP);
  };

  const resetGame = () => {
    setLobbyState({
      lobbyId: null,
      players: [],
      maxPlayers: 10,
      minPlayers: 3,
      gameStarted: false,
      currentRound: 0,
      roundResults: [],
      roundTimer: ROUND_TIME
    });
    setGameState({
      gamePhase: "lobby",
      currentRound: 0,
      timeLeft: ROUND_TIME,
      currentQuestion: null,
      selectedAnswer: null,
      isCorrect: null,
      eliminatedPlayers: [],
      winner: null,
      score: 0,
      xp: 0
    });
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const isHost = lobbyState.players[0]?.id === firebaseUser?.uid;

  return (
    <div className="space-y-6">
      {gameState.gamePhase === "lobby" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
            <Sword className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Mini Battle Royale</h2>
          <p className="text-muted-foreground">
            Join the ultimate quiz battle! Answer correctly or be eliminated. Last one standing wins!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={createLobby}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Create Lobby</CardTitle>
                <p className="text-sm text-muted-foreground">Start a new battle</p>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => {
                const lobbyId = prompt("Enter lobby ID:");
                if (lobbyId) joinLobby(lobbyId);
              }}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Join Lobby</CardTitle>
                <p className="text-sm text-muted-foreground">Enter lobby ID</p>
              </CardHeader>
            </Card>
          </div>
          
          <Button variant="outline" onClick={onCancel}>
            Back to Games
          </Button>
        </div>
      )}

      {lobbyState.lobbyId && !lobbyState.gameStarted && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Battle Lobby</h2>
            <p className="text-muted-foreground">Lobby ID: {lobbyState.lobbyId}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players ({lobbyState.players.length}/{lobbyState.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lobbyState.players.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{player.name}</span>
                      {player.id === firebaseUser?.uid && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <Badge variant="default">Ready</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 space-y-2">
              <p>• 10 players maximum per battle</p>
              <p>• Each round has a 10-second timer</p>
              <p>• Wrong answer = eliminated</p>
              <p>• Last player standing wins!</p>
              <p>• Winner gets 100 XP + bonus for correct answers</p>
            </CardContent>
          </Card>

          {isHost && (
            <div className="text-center">
              <Button 
                onClick={() => {}} 
                disabled={lobbyState.players.length < lobbyState.minPlayers}
                size="lg"
              >
                Start Battle ({lobbyState.players.length}/{lobbyState.minPlayers} players)
              </Button>
            </div>
          )}

          <Button variant="outline" onClick={resetGame}>
            Leave Lobby
          </Button>
        </div>
      )}

      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Mini Battle Royale</h2>
        <p className="text-muted-foreground">Coming Soon! Battle Royale functionality will be implemented.</p>
        <Button variant="outline" onClick={onCancel}>
          Back to Games
        </Button>
      </div>
    </div>
  );
} 