import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp } from "lucide-react";
import { getAllExerciseNames } from "@/lib/storage";

export default function Stats() {
  const [exercises, setExercises] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setExercises(getAllExerciseNames());
  }, []);

  return (
    <div className="min-h-screen pb-24 safe-top">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Статистика</h1>
        <p className="text-sm text-muted-foreground">Прогресс по упражнениям</p>
      </div>

      <div className="px-5">
        {exercises.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Нет данных</p>
            <p className="text-sm text-muted-foreground/60">
              Завершите тренировку, чтобы увидеть статистику
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((name) => (
              <button
                key={name}
                onClick={() =>
                  navigate(`/exercise/${encodeURIComponent(name)}`)
                }
                className="w-full p-4 bg-card rounded-2xl border border-border flex items-center gap-4 text-left active:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold capitalize">{name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
