import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Image, 
  Type, 
  Upload, 
  Vote, 
  Users, 
  Target, 
  Zap, 
  RotateCcw, 
  Check, 
  Heart,
  Share2
} from "lucide-react";
import { useAuthUser } from "../../hooks/useAuthUser";
import { doc, setDoc, onSnapshot, updateDoc, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";

interface MemeBuilderProps {
  onComplete: (score: number, xpEarned: number) => void;
  onCancel: () => void;
}

interface EducationalPrompt {
  id: string;
  topic: string;
  description: string;
  category: "science" | "history" | "math" | "literature" | "geography";
}

interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
}

interface MemeSubmission {
  id: string;
  promptId: string;
  promptTopic: string;
  creatorId: string;
  creatorName: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  votes: number;
  voters: string[];
  createdAt: Date;
}

interface GameState {
  currentPrompt: EducationalPrompt | null;
  selectedTemplate: MemeTemplate | null;
  uploadedImage: string | null;
  topText: string;
  bottomText: string;
  textColor: string;
  fontSize: number;
  gamePhase: "prompt" | "create" | "vote" | "results" | "completed";
  submissions: MemeSubmission[];
  currentVoteRound: MemeSubmission[];
  votedMemeId: string | null;
  score: number;
  xp: number;
}

// Sample educational prompts
const educationalPrompts: EducationalPrompt[] = [
  {
    id: "1",
    topic: "Newton's Third Law",
    description: "For every action, there is an equal and opposite reaction",
    category: "science"
  },
  {
    id: "2",
    topic: "Photosynthesis",
    description: "Plants convert sunlight into energy",
    category: "science"
  },
  {
    id: "3",
    topic: "The Pythagorean Theorem",
    description: "a² + b² = c² in right triangles",
    category: "math"
  },
  {
    id: "4",
    topic: "Shakespeare's Hamlet",
    description: "To be or not to be, that is the question",
    category: "literature"
  },
  {
    id: "5",
    topic: "The Water Cycle",
    description: "Evaporation, condensation, precipitation, collection",
    category: "science"
  }
];

// Sample meme templates
const memeTemplates: MemeTemplate[] = [
  {
    id: "1",
    name: "Classic Meme",
    imageUrl: "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Classic+Meme",
    category: "general"
  },
  {
    id: "2",
    name: "Science Lab",
    imageUrl: "https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Science+Lab",
    category: "science"
  },
  {
    id: "3",
    name: "Math Formulas",
    imageUrl: "https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Math+Formulas",
    category: "math"
  },
  {
    id: "4",
    name: "History Scene",
    imageUrl: "https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=History+Scene",
    category: "history"
  }
];

const XP_PER_VOTE = 5;
const XP_PER_WIN = 20;
const BONUS_XP_CREATION = 15;

export function MemeBuilder({ onComplete, onCancel }: MemeBuilderProps) {
  const { user, firebaseUser } = useAuthUser();
  const [gameMode, setGameMode] = useState<"solo" | "multiplayer" | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentPrompt: null,
    selectedTemplate: null,
    uploadedImage: null,
    topText: "",
    bottomText: "",
    textColor: "#FFFFFF",
    fontSize: 32,
    gamePhase: "prompt",
    submissions: [],
    currentVoteRound: [],
    votedMemeId: null,
    score: 0,
    xp: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    const randomPrompt = educationalPrompts[Math.floor(Math.random() * educationalPrompts.length)];
    setGameState(prev => ({
      ...prev,
      currentPrompt: randomPrompt,
      gamePhase: "create"
    }));
  };

  const handleTemplateSelect = (template: MemeTemplate) => {
    setGameState(prev => ({
      ...prev,
      selectedTemplate: template,
      uploadedImage: null
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setGameState(prev => ({
        ...prev,
        uploadedImage: e.target?.result as string,
        selectedTemplate: null
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToFirebase = async (imageDataUrl: string): Promise<string> => {
    if (!firebaseUser) throw new Error("User not authenticated");

    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    const fileName = `memes/${firebaseUser.uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const generateMemeImage = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not available");

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context not available");

    const imageUrl = gameState.uploadedImage || gameState.selectedTemplate?.imageUrl;
    if (!imageUrl) throw new Error("No image selected");

    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw background image
        ctx.drawImage(img, 0, 0);
        
        // Configure text style
        ctx.fillStyle = gameState.textColor;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.font = `bold ${gameState.fontSize}px Impact, Arial, sans-serif`;
        ctx.textAlign = "center";
        
        // Draw top text
        if (gameState.topText) {
          const topY = gameState.fontSize + 10;
          ctx.strokeText(gameState.topText, canvas.width / 2, topY);
          ctx.fillText(gameState.topText, canvas.width / 2, topY);
        }
        
        // Draw bottom text
        if (gameState.bottomText) {
          const bottomY = canvas.height - 10;
          ctx.strokeText(gameState.bottomText, canvas.width / 2, bottomY);
          ctx.fillText(gameState.bottomText, canvas.width / 2, bottomY);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }, [gameState]);

  const submitMeme = async () => {
    if (!firebaseUser || !gameState.currentPrompt) return;
    
    setIsLoading(true);
    try {
      const memeImageDataUrl = await generateMemeImage();
      const imageUrl = await uploadImageToFirebase(memeImageDataUrl);
      
      const submission: Omit<MemeSubmission, 'id'> = {
        promptId: gameState.currentPrompt.id,
        promptTopic: gameState.currentPrompt.topic,
        creatorId: firebaseUser.uid,
        creatorName: (user as any)?.displayName || "Anonymous",
        imageUrl,
        topText: gameState.topText,
        bottomText: gameState.bottomText,
        votes: 0,
        voters: [],
        createdAt: new Date()
      };
      
      await addDoc(collection(db, "memeSubmissions"), submission);
      
      setGameState(prev => ({
        ...prev,
        gamePhase: "vote",
        score: prev.score + 10,
        xp: prev.xp + BONUS_XP_CREATION
      }));
      
    } catch (error) {
      console.error("Error submitting meme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const voteForMeme = async (memeId: string) => {
    if (!firebaseUser || gameState.votedMemeId) return;
    
    try {
      const submissionRef = doc(db, "memeSubmissions", memeId);
      await updateDoc(submissionRef, {
        votes: gameState.currentVoteRound.find(m => m.id === memeId)?.votes + 1,
        voters: [...(gameState.currentVoteRound.find(m => m.id === memeId)?.voters || []), firebaseUser.uid]
      });
      
      setGameState(prev => ({
        ...prev,
        votedMemeId: memeId,
        score: prev.score + 5,
        xp: prev.xp + XP_PER_VOTE
      }));
      
      // Show results after a short delay
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          gamePhase: "results"
        }));
      }, 2000);
      
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleComplete = () => {
    const totalXP = gameState.xp + Math.floor(gameState.score / 10) * 5;
    onComplete(gameState.score, totalXP);
  };

  const resetGame = () => {
    setGameMode(null);
    setGameState({
      currentPrompt: null,
      selectedTemplate: null,
      uploadedImage: null,
      topText: "",
      bottomText: "",
      textColor: "#FFFFFF",
      fontSize: 32,
      gamePhase: "prompt",
      submissions: [],
      currentVoteRound: [],
      votedMemeId: null,
      score: 0,
      xp: 0
    });
  };

  // Load sample submissions for voting
  useEffect(() => {
    if (gameState.gamePhase === "vote") {
      setGameState(prev => ({
        ...prev,
        currentVoteRound: [
          {
            id: "1",
            promptId: "1",
            promptTopic: "Newton's Third Law",
            creatorId: "user1",
            creatorName: "Alex",
            imageUrl: "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Sample+Meme+1",
            topText: "When you push",
            bottomText: "The wall pushes back",
            votes: 5,
            voters: [],
            createdAt: new Date()
          },
          {
            id: "2",
            promptId: "1",
            promptTopic: "Newton's Third Law",
            creatorId: "user2",
            creatorName: "Sarah",
            imageUrl: "https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Sample+Meme+2",
            topText: "Equal and opposite",
            bottomText: "That's the law",
            votes: 3,
            voters: [],
            createdAt: new Date()
          }
        ]
      }));
    }
  }, [gameState.gamePhase]);

  return (
    <div className="space-y-6">
      {!gameMode && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
            <Image className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Meme Builder</h2>
          <p className="text-muted-foreground">
            Create educational memes and vote for the funniest ones! Learn while having fun.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => {
                setGameMode("solo");
                startGame();
              }}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Solo Mode</CardTitle>
                <p className="text-sm text-muted-foreground">Create memes and vote on others</p>
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
                <p className="text-sm text-muted-foreground">Compete with friends</p>
              </CardHeader>
            </Card>
          </div>
          
          <Button variant="outline" onClick={onCancel}>
            Back to Games
          </Button>
        </div>
      )}

      {gameState.gamePhase === "create" && gameState.currentPrompt && (
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
              {gameState.currentPrompt.category.toUpperCase()}
            </Badge>
          </div>

          {/* Educational Prompt */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Educational Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-bold text-blue-900 mb-2">{gameState.currentPrompt.topic}</h3>
              <p className="text-blue-700">{gameState.currentPrompt.description}</p>
            </CardContent>
          </Card>

          {/* Meme Creation Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Canvas Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Meme Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <canvas
                  ref={canvasRef}
                  className="border rounded-lg max-w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="space-y-4">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Choose Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {memeTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                          gameState.selectedTemplate?.id === template.id
                            ? 'border-primary bg-primary/10'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <img
                          src={template.imageUrl}
                          alt={template.name}
                          className="w-full h-20 object-cover rounded"
                        />
                        <p className="text-xs text-center mt-1">{template.name}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your Image
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Text Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Add Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Top Text</label>
                    <Input
                      value={gameState.topText}
                      onChange={(e) => setGameState(prev => ({ ...prev, topText: e.target.value }))}
                      placeholder="Enter top text..."
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Bottom Text</label>
                    <Input
                      value={gameState.bottomText}
                      onChange={(e) => setGameState(prev => ({ ...prev, bottomText: e.target.value }))}
                      placeholder="Enter bottom text..."
                      maxLength={50}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Text Color</label>
                      <div className="flex gap-1 mt-1">
                        {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded border-2 ${
                              gameState.textColor === color ? 'border-primary' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setGameState(prev => ({ ...prev, textColor: color }))}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Font Size</label>
                      <Input
                        type="range"
                        min="20"
                        max="60"
                        value={gameState.fontSize}
                        onChange={(e) => setGameState(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                        className="mt-1"
                      />
                      <span className="text-xs text-muted-foreground">{gameState.fontSize}px</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                onClick={submitMeme}
                disabled={isLoading || (!gameState.selectedTemplate && !gameState.uploadedImage)}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                Submit Meme
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState.gamePhase === "vote" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Vote for the Funniest Meme!</h2>
            <p className="text-muted-foreground">Click on your favorite meme to vote</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameState.currentVoteRound.map((meme) => (
              <Card
                key={meme.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  gameState.votedMemeId === meme.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => voteForMeme(meme.id)}
              >
                <CardContent className="p-4">
                  <img
                    src={meme.imageUrl}
                    alt="Meme"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{meme.creatorName}</p>
                    <p className="text-xs text-muted-foreground">{meme.promptTopic}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        <Vote className="w-3 h-3 mr-1" />
                        {meme.votes} votes
                      </Badge>
                      {gameState.votedMemeId === meme.id && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {gameState.gamePhase === "results" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-600">Voting Complete!</h2>
            <p className="text-muted-foreground">Thanks for participating!</p>
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
              +{gameState.xp + Math.floor(gameState.score / 10) * 5} XP Earned!
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