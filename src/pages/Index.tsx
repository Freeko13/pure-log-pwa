import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getWorkouts, deleteWorkout, addWorkout, generateId, getBodyWeight } from "@/lib/storage";
import { Workout } from "@/types/workout";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setWorkouts(getWorkouts());
  }, []);

  const startNewWorkout = () => {
    const id = generateId();
    navigate(`/workout/${id}`);
  };

  const copyWorkout = (e: React.MouseEvent, w: Workout) => {
    e.stopPropagation();
    const newId = generateId();
    const copied: Workout = {
      ...w,
      id: newId,
      date: new Date().toISOString(),
      exercises: w.exercises.map((ex) => ({
        ...ex,
        id: generateId(),
        sets: ex.sets.map((s) => ({ ...s, id: generateId() })),
      })),
    };
    addWorkout(copied);
    setWorkouts(getWorkouts());
    setHighlightId(newId);
    setTimeout(() => setHighlightId(null), 2000);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteWorkout(deleteId);
      setWorkouts(getWorkouts());
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
  };

  const getTotalVolume = (w: Workout) => {
    const bodyWeight = getBodyWeight();
    let vol = 0;
    w.exercises.forEach((e) =>
      e.sets.forEach((s) => {
        if (e.isGravitron && bodyWeight > 0) {
          vol += Math.max(0, bodyWeight - s.weight) * s.reps;
        } else {
          vol += s.weight * s.reps;
        }
      })
    );
    return vol;
  };

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Iron Log</h1>
            <p className="text-sm text-muted-foreground">Отслеживай прогресс</p>
          </div>
        </div>
      </div>

      {/* Start workout FAB */}
      <div className="px-5 mb-6">
        <Button
          onClick={startNewWorkout}
          className="w-full h-14 text-base font-semibold rounded-2xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          Начать тренировку
        </Button>
      </div>

      {/* Workout list */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          История
        </h2>
        {workouts.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Тренировок пока нет</p>
            <p className="text-sm text-muted-foreground/60">Начни первую тренировку!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {workouts.map((w) => (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -200 }}
                >
                  <SwipeToDelete onDelete={() => setDeleteId(w.id)}>
                    <button
                      onClick={() => navigate(`/workout/${w.id}`)}
                      className={`w-full p-4 flex items-center gap-4 text-left transition-colors duration-700 rounded-xl ${
                        highlightId === w.id ? "bg-primary/15" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">
                          {w.name || formatDate(w.date)}
                        </div>
                        {w.name && (
                          <div className="text-xs text-muted-foreground/70">
                            {formatDate(w.date)}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground truncate">
                          {w.exercises.map((e) => e.name).join(", ") || "Пустая тренировка"}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {w.exercises.length} упр. · {getTotalVolume(w).toLocaleString()} кг
                        </div>
                      </div>
                      <button
                        onClick={(e) => copyWorkout(e, w)}
                        className="gym-touch flex items-center justify-center text-muted-foreground/40 shrink-0 p-2 rounded-lg hover:bg-secondary active:bg-secondary"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </button>
                  </SwipeToDelete>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тренировку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Тренировка будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
