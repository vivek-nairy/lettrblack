import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  Trophy,
  Crown,
  Store,
  X,
  Sun,
  Moon,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "My Groups", href: "/groups", icon: Users },
  { name: "LettrPlay", href: "/lettrplay", icon: Gamepad2 },
  { name: "XP", href: "/xp", icon: Trophy },
  { name: "Leaderboard", href: "/leaderboard", icon: Crown },
  { name: "Marketplace", href: "/marketplace", icon: Store },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
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
        <div className="flex items-center justify-between py-4 pl-4 pr-6">
          <div className="flex items-center gap-2 h-12">
            {/* Show only one logo based on theme */}
            {theme === "dark" ? (
              <img src="/LettrBlack_logo.png" alt="LettrBlack Logo" className="h-10 w-auto" />
            ) : (
              <img src="/LettrBlack_logo_black.png" alt="LettrBlack Logo" className="h-10 w-auto" />
            )}
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
        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
