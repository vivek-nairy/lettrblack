import "./global.css";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Index } from "./pages/Index";
import { Groups } from "./pages/Groups";
import { Notes } from "./pages/Notes";
import { XP } from "./pages/XP";
import { Leaderboard } from "./pages/Leaderboard";
import { Marketplace } from "./pages/Marketplace";
import { Profile } from "./pages/Profile";
import { Upgrade } from "./pages/Upgrade";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import NotFound from "./pages/NotFound";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { LiveChatWidget } from "@/components/LiveChatWidget";

const queryClient = new QueryClient();

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  );
}

const App = () => {
  // Set dark mode on app load
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <AuthWrapper>
                <Index />
              </AuthWrapper>
            } />
            <Route path="/groups" element={
              <AuthWrapper>
                <Groups />
              </AuthWrapper>
            } />
            <Route path="/notes" element={
              <AuthWrapper>
                <Notes />
              </AuthWrapper>
            } />
            <Route path="/xp" element={
              <AuthWrapper>
                <XP />
              </AuthWrapper>
            } />
            <Route path="/leaderboard" element={
              <AuthWrapper>
                <Leaderboard />
              </AuthWrapper>
            } />
            <Route path="/marketplace" element={
              <AuthWrapper>
                <Marketplace />
              </AuthWrapper>
            } />
            <Route path="/profile" element={
              <AuthWrapper>
                <Profile />
              </AuthWrapper>
            } />
            <Route path="/upgrade" element={
              <AuthWrapper>
                <Upgrade />
              </AuthWrapper>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <LiveChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
