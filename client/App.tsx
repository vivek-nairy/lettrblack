import "./global.css";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Index } from "./pages/Index";
import { Groups } from "./pages/Groups";
import { Chat } from "./pages/Chat";
import { XP } from "./pages/XP";
import { Leaderboard } from "./pages/Leaderboard";
import Marketplace from "./pages/Marketplace";
import LettrPlay from "./pages/LettrPlay";
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
import Notifications from "./pages/Notifications";
import { XPProvider } from "./contexts/XPContext";
import { useAuthUser } from "./hooks/useAuthUser";
import ByteLearn from "./pages/ByteLearn";

const queryClient = new QueryClient();

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <XPProvider>
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
              <Route path="/chat/:groupId" element={
                <AuthWrapper>
                  <Chat />
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
              <Route path="/bytelearn" element={
                <AuthWrapper>
                  <ByteLearn />
                </AuthWrapper>
              } />
              <Route path="/lettrplay" element={
                <AuthWrapper>
                  <LettrPlay />
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
              <Route path="/notifications" element={
                <AuthWrapper>
                  <Notifications />
                </AuthWrapper>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LiveChatWidget />
          </BrowserRouter>
        </XPProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
