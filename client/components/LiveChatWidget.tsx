import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: any;
}

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, `livechatMessages`),
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
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, `livechatMessages`), {
        sender: "User", // or "Admin" for admin messages
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
    <>
      {/* Chat Bubble */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-110 transition-all"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l.8-3.2A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[95vw] bg-card border border-border rounded-xl shadow-2xl flex flex-col h-96">
          <div className="flex items-center justify-between p-3 border-b border-border bg-primary text-primary-foreground rounded-t-xl">
            <span className="font-semibold">LettrBlack Live Chat</span>
            <button onClick={() => setOpen(false)} className="text-lg font-bold">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "User" ? "items-end" : "items-start"}`}>
                <span className="text-xs text-muted-foreground mb-1">
                  {msg.sender} • {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : "..."}
                </span>
                <span className={`rounded px-3 py-2 text-foreground max-w-xs ${msg.sender === "User" ? "bg-primary/20" : "bg-muted"}`}>
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border bg-background">
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
      )}
    </>
  );
} 