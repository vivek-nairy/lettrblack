import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  Sparkles,
  Search,
  Filter,
  TrendingUp
} from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface NotesAIChatbotProps {
  onSearch: (query: string) => void;
  onFilterBySubject: (subject: string) => void;
  onFilterByPrice: (minPrice: number, maxPrice: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function NotesAIChatbot({ 
  onSearch, 
  onFilterBySubject, 
  onFilterByPrice, 
  isOpen, 
  onToggle 
}: NotesAIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI assistant for finding study notes. I can help you search for notes by subject, price, or specific topics. Try asking me something like 'Show me Physics notes under ₹100' or 'Find Java programming notes'.",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        "Show me Physics notes under ₹100",
        "Find Java programming notes",
        "Latest uploads in Psychology",
        "Free notes in Mathematics"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const processUserMessage = async (userMessage: string) => {
    const messageId = Date.now().toString();
    
    // Add user message
    setMessages(prev => [...prev, {
      id: messageId,
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    }]);

    setIsTyping(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Process the message and generate response
    const response = await generateAIResponse(userMessage);
    
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      text: response.text,
      isUser: false,
      timestamp: new Date(),
      suggestions: response.suggestions
    }]);

    setIsTyping(false);
  };

  const generateAIResponse = async (userMessage: string): Promise<{ text: string; suggestions?: string[] }> => {
    const message = userMessage.toLowerCase();
    
    // Extract price information
    const priceMatch = message.match(/under ₹(\d+)/i) || message.match(/under rs\.?(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;
    
    // Extract subject information
    const subjects = [
      "physics", "chemistry", "biology", "mathematics", "math", "english", 
      "history", "geography", "economics", "computer science", "programming",
      "java", "python", "javascript", "react", "node.js", "psychology",
      "sociology", "philosophy", "literature", "art", "music"
    ];
    
    const foundSubject = subjects.find(subject => message.includes(subject));
    
    // Extract free notes request
    const isFreeRequest = message.includes("free") || message.includes("₹0");
    
    // Generate appropriate response
    if (foundSubject && maxPrice) {
      onFilterBySubject(foundSubject);
      onFilterByPrice(0, maxPrice);
      return {
        text: `I found ${foundSubject} notes under ₹${maxPrice}. I've filtered the results for you. You can also try searching for other subjects or price ranges.`,
        suggestions: [
          `Show me ${foundSubject} notes under ₹${Math.floor(maxPrice * 0.5)}`,
          `Find ${foundSubject} notes with examples`,
          "Show me all free notes",
          "Latest uploads"
        ]
      };
    } else if (foundSubject) {
      onFilterBySubject(foundSubject);
      return {
        text: `I found ${foundSubject} notes. I've filtered the results for you. You can also specify a price range like "under ₹100" to narrow down the results.`,
        suggestions: [
          `Show me ${foundSubject} notes under ₹100`,
          `Find ${foundSubject} notes with examples`,
          "Show me all free notes",
          "Latest uploads"
        ]
      };
    } else if (maxPrice) {
      onFilterByPrice(0, maxPrice);
      return {
        text: `I found notes under ₹${maxPrice}. I've filtered the results for you. You can also specify a subject to get more targeted results.`,
        suggestions: [
          "Show me Physics notes under ₹100",
          "Find Java programming notes",
          "Show me all free notes",
          "Latest uploads"
        ]
      };
    } else if (isFreeRequest) {
      onFilterByPrice(0, 0);
      return {
        text: "I found free notes for you. I've filtered the results to show only free notes. You can also search for specific subjects or set a price range.",
        suggestions: [
          "Show me Physics notes under ₹100",
          "Find Java programming notes",
          "Latest uploads",
          "Most popular notes"
        ]
      };
    } else if (message.includes("latest") || message.includes("recent")) {
      onSearch("latest");
      return {
        text: "I've shown you the latest uploads. These are the most recently added notes to the marketplace.",
        suggestions: [
          "Show me Physics notes under ₹100",
          "Find Java programming notes",
          "Show me all free notes",
          "Most popular notes"
        ]
      };
    } else if (message.includes("popular") || message.includes("trending")) {
      onSearch("popular");
      return {
        text: "I've shown you the most popular notes based on views and downloads. These are highly recommended by other students.",
        suggestions: [
          "Show me Physics notes under ₹100",
          "Find Java programming notes",
          "Show me all free notes",
          "Latest uploads"
        ]
      };
    } else {
      // General search
      onSearch(userMessage);
      return {
        text: `I've searched for "${userMessage}" in the notes. You can also try being more specific with subjects or price ranges to get better results.`,
        suggestions: [
          "Show me Physics notes under ₹100",
          "Find Java programming notes",
          "Show me all free notes",
          "Latest uploads"
        ]
      };
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    processUserMessage(inputValue.trim());
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    processUserMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggle}
          className="w-14 h-14 rounded-full shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110 bg-primary text-primary-foreground"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Find your perfect study notes</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.isUser ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className={cn(
                "text-xs",
                message.isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}>
                {message.isUser ? "U" : <Bot className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            
            <div
              className={cn(
                "max-w-xs",
                message.isUser ? "text-right" : "text-left"
              )}
            >
              <div
                className={cn(
                  "inline-block p-3 rounded-2xl shadow-sm",
                  message.isUser
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
              
              {message.suggestions && (
                <div className="mt-2 space-y-1">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left text-xs text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted transition-colors"
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-muted text-foreground">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted text-foreground rounded-2xl rounded-bl-md p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about notes..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping || !inputValue.trim()}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 