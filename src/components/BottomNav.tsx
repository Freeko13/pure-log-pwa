import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, BarChart3, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Главная" },
  { path: "/stats", icon: BarChart3, label: "Статистика" },
  { path: "/profile", icon: User, label: "Профиль" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav during active workout
  if (location.pathname.startsWith("/workout/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-6 gym-touch transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
