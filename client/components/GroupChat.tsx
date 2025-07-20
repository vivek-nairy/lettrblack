import { useState, useEffect, useRef } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import { sendMessage, subscribeToMessages } from "../lib/firestore-utils";
import { storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Send, 
  Paperclip, 
  Download, 
  Image as ImageIcon, 
  File, 
  X, 
  MoreVertical,
  Smile,
  Mic,
  Maximize2,
  Minimize2,
  Settings
} from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface GroupChatProps {
  groupId: string;
  groupName?: string;
  groupImage?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function GroupChat({ 
  groupId, 
  groupName = "Group Chat", 
  groupImage,
  onClose,
  isExpanded = false,
  onToggleExpand 
}: GroupChatProps) {
  const { firebaseUser } = useAuthUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!groupId) return;

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(groupId, (newMessages) => {
      setMessages(newMessages as Message[]);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!firebaseUser || (!newMessage.trim() && !selectedFile)) return;

    setIsLoading(true);
    try {
      let fileUrl = "";
      let fileName = "";
      let fileType = "";

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const fileRef = ref(storage, `group-files/${groupId}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(fileRef, selectedFile);
        fileUrl = await getDownloadURL(fileRef);
        fileName = selectedFile.name;
        fileType = selectedFile.type;
        setIsUploading(false);
      }

      // Send message
      await sendMessage(groupId, {
        senderId: firebaseUser.uid,
        senderName: firebaseUser.displayName || "Anonymous",
        text: newMessage.trim(),
        fileUrl,
        fileName,
        fileType,
      });

      setNewMessage("");
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const isOwnMessage = (message: Message) => message.senderId === firebaseUser?.uid;

  const shouldShowDate = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentDate = formatDate(message.timestamp);
    const prevDate = formatDate(prevMessage.timestamp);
    return currentDate !== prevDate;
  };

  return (
    <div className={cn(
      "flex flex-col bg-card border border-border rounded-lg shadow-lg transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50" : "h-96"
    )}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={groupImage} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {groupName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{groupName}</h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} messages
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
        {messages.map((message, index) => (
          <div key={message.id}>
            {/* Date Separator */}
            {shouldShowDate(message, index) && (
              <div className="flex justify-center my-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {formatDate(message.timestamp)}
                </span>
              </div>
            )}
            
            {/* Message */}
            <div
              className={cn(
                "flex gap-3 group",
                isOwnMessage(message) ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs">
                  {message.senderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div
                className={cn(
                  "max-w-xs lg:max-w-md",
                  isOwnMessage(message) ? "text-right" : "text-left"
                )}
              >
                <div
                  className={cn(
                    "inline-block p-3 rounded-2xl shadow-sm transition-all duration-200",
                    isOwnMessage(message)
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md hover:bg-muted/80"
                  )}
                >
                  {message.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  )}
                  
                  {message.fileUrl && (
                    <div className="mt-2">
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs hover:underline transition-colors"
                      >
                        {getFileIcon(message.fileType || "")}
                        <span className="truncate">{message.fileName}</span>
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background">
        {selectedFile && (
          <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile.type)}
              <span className="text-sm text-foreground truncate">{selectedFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="text-destructive hover:text-destructive h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground p-2"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none min-h-[40px] max-h-24"
              disabled={isLoading}
              rows={1}
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-2"
            disabled={isLoading}
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-2"
            disabled={isLoading}
          >
            <Mic className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!newMessage.trim() && !selectedFile)}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 p-2"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {isUploading && (
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Uploading file...</p>
          </div>
        )}
      </div>
    </div>
  );
} 