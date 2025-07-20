import { useState, useEffect, useRef } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import { sendMessage, subscribeToMessages } from "../lib/firestore-utils";
import { storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Send, Paperclip, Download, Image as ImageIcon, File } from "lucide-react";
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
}

export function GroupChat({ groupId }: GroupChatProps) {
  const { firebaseUser } = useAuthUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const fileRef = ref(storage, `group-files/${groupId}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(fileRef, selectedFile);
        fileUrl = await getDownloadURL(fileRef);
        fileName = selectedFile.name;
        fileType = selectedFile.type;
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

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const isOwnMessage = (message: Message) => message.senderId === firebaseUser?.uid;

  return (
    <div className="flex flex-col h-96 bg-card border border-border rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Group Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              isOwnMessage(message) ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback>
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
                  "inline-block p-3 rounded-lg",
                  isOwnMessage(message)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {message.text && <p className="text-sm">{message.text}</p>}
                
                {message.fileUrl && (
                  <div className="mt-2">
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs hover:underline"
                    >
                      {getFileIcon(message.fileType || "")}
                      <span>{message.fileName}</span>
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-1 text-xs text-muted-foreground">
                {message.senderName} • {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        {selectedFile && (
          <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm text-foreground">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="text-destructive hover:text-destructive"
            >
              ×
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button variant="outline" size="sm" className="px-2">
              <Paperclip className="w-4 h-4" />
            </Button>
          </label>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
            disabled={isLoading}
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!newMessage.trim() && !selectedFile)}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 