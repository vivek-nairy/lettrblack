import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, Play, Users, Target, Zap, RotateCcw, Check, X, Info } from "lucide-react";
import { useAuthUser } from "../../hooks/useAuthUser";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface GuessTheSoundProps {
  onComplete: (score: number, xpEarned: number) => void;
  onCancel: () => void;
}

interface SoundQuestion {
  id: string;
  audioUrl: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: "animals" | "nature" | "history" | "science" | "music";
  difficulty: "easy" | "medium" | "hard";
}

interface GameState {
  currentQuestion: number;
  score: number;
  xp: number;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  showExplanation: boolean;
  gameOver: boolean;
  roundComplete: boolean;
}

interface MultiplayerState {
  isHost: boolean;
  roomId: string | null;
  players: { id: string; name: string; score: number; ready: boolean }[];
  gameStarted: boolean;
  currentRound: number;
  roundResults: { playerId: string; answer: string; correct: boolean }[];
}

// Sample sound questions (in production, these would be stored in Firebase)
const sampleQuestions: SoundQuestion[] = [
  {
    id: "1",
    audioUrl: "https://example.com/sounds/lion-roar.mp3", // Placeholder URLs
    question: "What animal makes this sound?",
    options: ["Lion", "Tiger", "Bear", "Wolf"],
    correctAnswer: "Lion",
    explanation: "This is the distinctive roar of a lion, the king of the jungle. Lions use their powerful roar to communicate with pride members and establish territory.",
    category: "animals",
    difficulty: "easy"
  },
  {
    id: "2",
    audioUrl: "https://example.com/sounds/thunder.mp3",
    question: "What natural phenomenon produces this sound?",
    options: ["Thunder", "Volcano", "Earthquake", "Wind"],
    correctAnswer: "Thunder",
    explanation: "Thunder is the sound caused by lightning. When lightning heats the air to 30,000°C, it creates a shock wave that we hear as thunder.",
    category: "nature",
    difficulty: "easy"
  },
  {
    id: "3",
    audioUrl: "https://example.com/sounds/einstein-voice.mp3",
    question: "Whose voice is this?",
    options: ["Albert Einstein", "Isaac Newton", "Nikola Tesla", "Thomas Edison"],
    correctAnswer: "Albert Einstein",
    explanation: "This is a recording of Albert Einstein explaining his theory of relativity. His distinctive German accent and thoughtful delivery are characteristic of his speaking style.",
    category: "history",
    difficulty: "medium"
  },
  {
    id: "4",
    audioUrl: "https://example.com/sounds/heartbeat.mp3",
    question: "What is this sound?",
    options: ["Heartbeat", "Clock ticking", "Drum beat", "Footsteps"],
    correctAnswer: "Heartbeat",
    explanation: "This is the sound of a healthy human heartbeat. The 'lub-dub' sound is created by the closing of heart valves as blood flows through the chambers.",
    category: "science",
    difficulty: "medium"
  },
  {
    id: "5",
    audioUrl: "https://example.com/sounds/mozart-symphony.mp3",
    question: "Which composer wrote this piece?",
    options: ["Mozart", "Beethoven", "Bach", "Chopin"],
    correctAnswer: "Mozart",
    explanation: "This is from Mozart's Symphony No. 40 in G minor. His elegant, classical style and melodic clarity are hallmarks of his compositions.",
    category: "music",
    difficulty: "hard"
  }
];

const GAME_ROUNDS = 5;
const XP_PER_CORRECT = 10;
const BONUS_XP_PER_ROUND = 5;

export function GuessTheSound({ onComplete, onCancel }: GuessTheSoundProps) {
  const { user, firebaseUser } = useAuthUser();
  const [gameMode, setGameMode] = useState<"solo" | "multiplayer" | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    score: 0,
    xp: 0,
    selectedAnswer: null,
    isCorrect: null,
    showExplanation: false,
    gameOver: false,
    roundComplete: false
  });
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState>({
    isHost: false,
    roomId: null,
    players: [],
    gameStarted: false,
    currentRound: 0,
    roundResults: []
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questions = sampleQuestions.slice(0, GAME_ROUNDS);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current.addEventListener('error', () => {
      setIsPlaying(false);
      console.log('Audio failed to load, using placeholder');
    });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Multiplayer room management
  useEffect(() => {
    if (gameMode === "multiplayer" && multiplayerState.roomId) {
      const roomRef = doc(db, "soundGameRooms", multiplayerState.roomId);
      
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setMultiplayerState(prev => ({
            ...prev,
            players: data.players || [],
            gameStarted: data.gameStarted || false,
            currentRound: data.currentRound || 0,
            roundResults: data.roundResults || []
          }));
        }
      });

      return unsubscribe;
    }
  }, [gameMode, multiplayerState.roomId]);

  const createMultiplayerRoom = async () => {
    if (!firebaseUser) return;
    
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const roomRef = doc(db, "soundGameRooms", roomId);
    
    await setDoc(roomRef, {
      hostId: firebaseUser.uid,
      players: [{
        id: firebaseUser.uid,
        name: user?.displayName || "Player",
        score: 0,
        ready: false
      }],
      gameStarted: false,
      currentRound: 0,
      roundResults: [],
      createdAt: new Date()
    });

    setMultiplayerState(prev => ({
      ...prev,
      isHost: true,
      roomId
    }));
  };

  const joinMultiplayerRoom = async (roomId: string) => {
    if (!firebaseUser) return;
    
    const roomRef = doc(db, "soundGameRooms", roomId);
    await updateDoc(roomRef, {
      players: [...multiplayerState.players, {
        id: firebaseUser.uid,
        name: user?.displayName || "Player",
        score: 0,
        ready: false
      }]
    });

    setMultiplayerState(prev => ({
      ...prev,
      isHost: false,
      roomId
    }));
  };

  const startMultiplayerGame = async () => {
    if (!multiplayerState.roomId) return;
    
    const roomRef = doc(db, "soundGameRooms", multiplayerState.roomId);
    await updateDoc(roomRef, {
      gameStarted: true,
      currentRound: 0
    });
  };

  const playSound = async () => {
    if (!audioRef.current) return;
    
    const currentQuestion = questions[gameState.currentQuestion];
    setIsLoading(true);
    
    try {
      // In production, this would load from Firebase Storage
      // For now, we'll simulate loading
      audioRef.current.src = currentQuestion.audioUrl;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.log('Audio playback failed, showing placeholder message');
      // Show a placeholder message instead of playing audio
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = questions[gameState.currentQuestion];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isCorrect,
      showExplanation: true,
      roundComplete: true
    }));

    if (isCorrect) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10,
        xp: prev.xp + XP_PER_CORRECT
      }));
    }

    // Update multiplayer state if in multiplayer mode
    if (gameMode === "multiplayer" && multiplayerState.roomId) {
      const roomRef = doc(db, "soundGameRooms", multiplayerState.roomId);
      updateDoc(roomRef, {
        roundResults: [...multiplayerState.roundResults, {
          playerId: firebaseUser?.uid,
          answer,
          correct: isCorrect
        }]
      });
    }
  };

  const nextQuestion = () => {
    if (gameState.currentQuestion < GAME_ROUNDS - 1) {
      setGameState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedAnswer: null,
        isCorrect: null,
        showExplanation: false,
        roundComplete: false
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        gameOver: true
      }));
    }
  };

  const startSoloGame = () => {
    setGameMode("solo");
    setGameState({
      currentQuestion: 0,
      score: 0,
      xp: 0,
      selectedAnswer: null,
      isCorrect: null,
      showExplanation: false,
      gameOver: false,
      roundComplete: false
    });
  };

  const handleComplete = () => {
    const xpEarned = gameState.xp + Math.floor(gameState.score / 10) * BONUS_XP_PER_ROUND;
    onComplete(gameState.score, xpEarned);
  };

  const resetGame = () => {
    setGameMode(null);
    setGameState({
      currentQuestion: 0,
      score: 0,
      xp: 0,
      selectedAnswer: null,
      isCorrect: null,
      showExplanation: false,
      gameOver: false,
      roundComplete: false
    });
    setMultiplayerState({
      isHost: false,
      roomId: null,
      players: [],
      gameStarted: false,
      currentRound: 0,
      roundResults: []
    });
  };

  const currentQuestion = questions[gameState.currentQuestion];

  return (
    <div className="space-y-6">
      {!gameMode && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Volume2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Guess the Sound</h2>
          <p className="text-muted-foreground">
            Listen to sounds and identify what they are! Learn about animals, nature, history, and more.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={startSoloGame}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Solo Mode</CardTitle>
                <p className="text-sm text-muted-foreground">Play alone and test your knowledge</p>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => setGameMode("multiplayer")}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Multiplayer</CardTitle>
                <p className="text-sm text-muted-foreground">Challenge friends to a sound battle</p>
              </CardHeader>
            </Card>
          </div>
          
          <Button variant="outline" onClick={onCancel}>
            Back to Games
          </Button>
        </div>
      )}

      {gameMode === "multiplayer" && !multiplayerState.roomId && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Multiplayer Setup</h2>
          <p className="text-muted-foreground">Create a room or join an existing one</p>
          
          <div className="flex gap-3">
            <Button onClick={createMultiplayerRoom} className="flex-1">
              Create Room
            </Button>
            <Button variant="outline" onClick={resetGame}>
              Back
            </Button>
          </div>
        </div>
      )}

      {gameMode === "multiplayer" && multiplayerState.roomId && !multiplayerState.gameStarted && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Waiting Room</h2>
          <p className="text-muted-foreground">Room ID: {multiplayerState.roomId}</p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Players:</h3>
            {multiplayerState.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <span>{player.name}</span>
                <Badge variant={player.ready ? "default" : "secondary"}>
                  {player.ready ? "Ready" : "Waiting"}
                </Badge>
              </div>
            ))}
          </div>
          
          {multiplayerState.isHost && (
            <Button onClick={startMultiplayerGame} disabled={multiplayerState.players.length < 2}>
              Start Game
            </Button>
          )}
          
          <Button variant="outline" onClick={resetGame}>
            Leave Room
          </Button>
        </div>
      )}

      {(gameMode === "solo" || (gameMode === "multiplayer" && multiplayerState.gameStarted)) && !gameState.gameOver && (
        <div className="space-y-6">
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
            <Badge variant="outline">
              Round {gameState.currentQuestion + 1}/{GAME_ROUNDS}
            </Badge>
          </div>

          {/* Sound Player */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Listen to the Sound</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button
                onClick={playSound}
                disabled={isLoading || isPlaying}
                size="lg"
                className="w-32 h-32 rounded-full"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <Volume2 className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Click to play sound"}
              </p>
            </CardContent>
          </Card>

          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={gameState.selectedAnswer !== null}
                    variant={
                      gameState.selectedAnswer === option
                        ? gameState.isCorrect
                          ? "default"
                          : "destructive"
                        : "outline"
                    }
                    className="h-16 text-lg"
                  >
                    {option}
                    {gameState.selectedAnswer === option && (
                      <span className="ml-2">
                        {gameState.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          {gameState.showExplanation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
              </CardContent>
            </Card>
          )}

          {/* Next Button */}
          {gameState.roundComplete && (
            <div className="text-center">
              <Button onClick={nextQuestion} size="lg">
                {gameState.currentQuestion < GAME_ROUNDS - 1 ? "Next Question" : "Finish Game"}
              </Button>
            </div>
          )}
        </div>
      )}

      {gameState.gameOver && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-600">Game Complete!</h2>
            <p className="text-muted-foreground">Great job identifying those sounds!</p>
          </div>

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
              +{gameState.xp + Math.floor(gameState.score / 10) * BONUS_XP_PER_ROUND} XP Earned!
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
  );
} 