import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuthUser } from "../hooks/useAuthUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GroupChatProps {
  groupId: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderUid: string;
  text: string;
  timestamp: any;
}

export function GroupChat({ groupId }: GroupChatProps) {
  const { user, firebaseUser } = useAuthUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, `groups/${groupId}/messages`),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatMessage))
      );
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firebaseUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, `groups/${groupId}/messages`), {
        senderName: user?.name || firebaseUser.displayName || "User",
        senderUid: firebaseUser.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {msg.senderName} • {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : "..."}
            </span>
            <span className="bg-muted rounded px-3 py-2 text-foreground max-w-xs">
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-2 border-t">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !newMessage.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
} 