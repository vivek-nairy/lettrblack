import "./global.css";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Notifications from "./pages/Notifications";
import { XPProvider } from "./contexts/XPContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SignInModal } from "./components/SignInModal";

const queryClient = new QueryClient();

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
        <AuthProvider>
          <XPProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                
                {/* All other routes are now public but with auth restrictions */}
                <Route path="/" element={<Index />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/chat/:groupId" element={<Chat />} />
                <Route path="/xp" element={<XP />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/lettrplay" element={<LettrPlay />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <SignInModal />
            </BrowserRouter>
          </XPProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
