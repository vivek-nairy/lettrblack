import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  Trophy,
  Crown,
  Store,
  Search,
  Bell,
  User,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "My Groups", href: "/groups", icon: Users },
  { name: "XP", href: "/xp", icon: Trophy },
  { name: "Leaderboard", href: "/leaderboard", icon: Crown },
  { name: "Marketplace", href: "/marketplace", icon: Store },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, firebaseUser } = useAuthUser();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            {/* Show black logo in light mode, white logo in dark mode */}
            <img src="/LettrBlack_logo_black.png" alt="LettrBlack Logo" className="h-10 w-auto block dark:hidden" />
            <img src="/LettrBlack_logo.png" alt="LettrBlack Logo" className="h-10 w-auto hidden dark:block" />
          </div>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        <nav className="px-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "lettrblack-sidebar-item",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="lettrblack-card bg-sidebar-accent p-4">
            <h3 className="font-semibold text-sidebar-foreground mb-2">
              Upgrade to Pro
            </h3>
            <p className="text-sm text-sidebar-foreground/70 mb-3">
              Unlock premium features and boost your learning
            </p>
            <Link
              to="/upgrade"
              className="lettrblack-button w-full text-sm text-center"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-md hover:bg-muted"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search groups, notes, or users..."
                  className="w-96 pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-md hover:bg-muted transition-colors"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400 transition-all" /> : <Moon className="w-5 h-5 text-blue-500 transition-all" />}
              </button>
              <button
                className="relative p-2 rounded-lg hover:bg-muted"
                onClick={() => navigate("/notifications")}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
              </button>

              <Link
                to="/profile"
                className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded-lg p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || firebaseUser?.photoURL || undefined} alt={user?.name || firebaseUser?.displayName || "User"} />
                  <AvatarFallback>{(user?.name || firebaseUser?.displayName || "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.name || firebaseUser?.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground">Level {user?.level || 1}</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
