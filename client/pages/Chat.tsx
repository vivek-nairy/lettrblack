import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthUser } from "../hooks/useAuthUser";
import { getGroup, subscribeToMessages, sendMessage, removeUserFromGroup } from "../lib/firestore-utils";
import { storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  Send, 
  Paperclip, 
  Download, 
  Image as ImageIcon, 
  File, 
  ArrowLeft,
  User,
  Settings,
  Mic,
  Smile,
  MoreVertical,
  Users,
  Edit,
  LogOut,
  Trash2,
  Phone
} from "lucide-react";
import { cn } from "../lib/utils";
import { Group, Message } from "../lib/firestore-structure";
import { useVideoCall } from "../hooks/useVideoCall";
import { VideoCallModal } from "../components/VideoCallModal";
import { subscribeToCallEvents } from "../lib/firestore-utils";
import { useNotifications } from "../hooks/useNotifications";
import { useToast } from "../hooks/use-toast";
import { ToastAction } from '@/components/ui/toast';

export function Chat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { firebaseUser } = useAuthUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video call hook
  const videoCall = useVideoCall(groupId || "", group?.name);
  
  // Notifications hook
  const notifications = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (!groupId || !firebaseUser) return;

    // Get group data
    const loadGroup = async () => {
      const groupData = await getGroup(groupId);
      if (groupData) {
        setGroup(groupData);
      } else {
        navigate("/groups");
      }
    };
    loadGroup();

    // Subscribe to real-time messages
    const unsubscribeMessages = subscribeToMessages(groupId, (newMessages) => {
      setMessages(newMessages as Message[]);
    });

    // Subscribe to call events
    const unsubscribeCallEvents = subscribeToCallEvents(groupId, (callEvent) => {
      if (callEvent && callEvent.status === 'calling' && callEvent.startedBy !== firebaseUser.uid) {
        // Show incoming call notification
        toast({
          title: "Incoming Group Call",
          description: `${callEvent.startedByName} started a call in ${callEvent.groupName}`,
          action: (
            <ToastAction altText="Join Call" onClick={() => {
              setShowVideoCall(true);
              videoCall.startCall();
            }}>
              Join
            </ToastAction>
          )
        });
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeCallEvents();
    };
  }, [groupId, firebaseUser, navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!firebaseUser || !groupId || (!newMessage.trim() && !selectedFile)) return;

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
  const isGroupAdmin = () => group?.ownerId === firebaseUser?.uid;

  const shouldShowDate = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentDate = formatDate(message.timestamp);
    const prevDate = formatDate(prevMessage.timestamp);
    return currentDate !== prevDate;
  };

  const handleExitGroup = async () => {
    if (!group || !firebaseUser) return;
    
    if (confirm("Are you sure you want to exit this group?")) {
      try {
        await removeUserFromGroup(group.id, firebaseUser.uid);
        navigate("/groups");
      } catch (error) {
        console.error("Error exiting group:", error);
      }
    }
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/groups")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={group.groupImageUrl || group.bannerUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {group.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="font-semibold text-foreground">{group.name}</h1>
            <p className="text-xs text-muted-foreground">
              {group.memberIds?.length || 1} members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!videoCall.isInCall && !videoCall.isConnecting) {
                setShowVideoCall(true);
                videoCall.startCall();
              }
            }}
            className="p-2"
            disabled={videoCall.isConnecting}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfile(true)}
            className="p-2"
          >
            <User className="w-5 h-5" />
          </Button>
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
                {!isOwnMessage(message) && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {message.senderName}
                  </div>
                )}
                
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
                      {message.fileType?.startsWith("image/") ? (
                        <img 
                          src={message.fileUrl} 
                          alt={message.fileName}
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                        />
                      ) : (
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
                      )}
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
        
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">T</AvatarFallback>
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

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
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
              <File className="w-3 h-3" />
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
              <div className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse"></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Uploading file...</p>
          </div>
        )}
      </div>

      {/* Group Profile Drawer */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Group Profile</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfile(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Group Image */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-2xl mx-auto mb-4">
                  {group.groupImageUrl ? (
                    <img 
                      src={group.groupImageUrl} 
                      alt={group.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    group.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="text-lg font-semibold">{group.name}</h3>
                <p className="text-muted-foreground">{group.subject}</p>
              </div>
              
              {/* Group Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.description || "No description"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Members</label>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {group.memberIds?.length || 1} members
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Invite Code</label>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {group.inviteCode}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                {isGroupAdmin() && (
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Group
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleExitGroup}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall && videoCall.isInCall}
        onClose={() => {
          setShowVideoCall(false);
          // Do NOT call videoCall.endCall() here
        }}
        localStream={videoCall.localStream}
        remoteStreams={videoCall.remoteStreams}
        participants={videoCall.participants}
        isMuted={videoCall.isMuted}
        isVideoOff={videoCall.isVideoOff}
        isConnecting={videoCall.isConnecting}
        error={videoCall.error}
        connectionStatus={videoCall.connectionStatus}
        onToggleMute={videoCall.toggleMute}
        onToggleVideo={videoCall.toggleVideo}
        onEndCall={() => {
          setShowVideoCall(false);
          videoCall.endCall();
        }}
      />
    </div>
  );
} 