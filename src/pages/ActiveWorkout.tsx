import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, X, Trophy, Trash2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getWorkouts,
  addWorkout,
  updateWorkout,
  getExercisePR,
  getExerciseNames,
  getExerciseIsGravitron,
  generateId,
} from "@/lib/storage";
import { Workout, Exercise, WorkoutSet } from "@/types/workout";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [knownExercises, setKnownExercises] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [replaceSheetExId, setReplaceSheetExId] = useState<string | null>(null);

  useEffect(() => {
    setKnownExercises(getExerciseNames());
    const existing = getWorkouts().find((w) => w.id === id);
    if (existing) {
      setWorkout(existing);
      // Expand last exercise by default
      if (existing.exercises.length > 0) {
        setExpandedExercise(existing.exercises[existing.exercises.length - 1].id);
      }
    } else {
      const newWorkout: Workout = {
        id: id || generateId(),
        date: new Date().toISOString(),
        exercises: [],
      };
      setWorkout(newWorkout);
      setIsNew(true);
    }
  }, [id]);

  const save = (w: Workout) => {
    setWorkout({ ...w });
    if (isNew) {
      addWorkout(w);
      setIsNew(false);
    } else {
      updateWorkout(w);
    }
  };

  const addExercise = () => {
    if (!workout) return;
    const newId = generateId();
    const updated = {
      ...workout,
      exercises: [
        ...workout.exercises,
        { id: newId, name: "", sets: [], isGravitron: false },
      ],
    };
    save(updated);
    setExpandedExercise(newId);
  };

  const prefillSetsFromPR = (exerciseName: string): WorkoutSet[] => {
    const pr = getExercisePR(exerciseName);
    if (pr.weight > 0 && pr.allSets.length > 0) {
      return pr.allSets.map((s) => ({
        id: generateId(),
        weight: s.weight,
        reps: s.reps,
      }));
    }
    return [];
  };

  const updateExerciseName = (exId: string, name: string) => {
    if (!workout) return;
    const exercises = workout.exercises.map((e) =>
      e.id === exId ? { ...e, name } : e
    );
    save({ ...workout, exercises });

    if (name.length > 0) {
      const matches = knownExercises.filter((n) =>
        n.toLowerCase().includes(name.toLowerCase())
      );
      setSuggestions(matches);
      setActiveInput(exId);
    } else {
      setSuggestions([]);
      setActiveInput(null);
    }
  };

  const selectSuggestion = (exId: string, name: string) => {
    if (!workout) return;
    const isGravitron = getExerciseIsGravitron(name);
    const prefilled = prefillSetsFromPR(name);
    const exercises = workout.exercises.map((e) =>
      e.id === exId ? { ...e, name, isGravitron, sets: prefilled } : e
    );
    save({ ...workout, exercises });
    setSuggestions([]);
    setActiveInput(null);
  };

  const toggleGravitron = (exId: string) => {
    if (!workout) return;
    const exercises = workout.exercises.map((e) =>
      e.id === exId ? { ...e, isGravitron: !e.isGravitron } : e
    );
    save({ ...workout, exercises });
  };

  const updateWorkoutName = (name: string) => {
    if (!workout) return;
    save({ ...workout, name });
  };

  const addSet = (exId: string) => {
    if (!workout) return;
    const exercises = workout.exercises.map((e) => {
      if (e.id !== exId) return e;
      const lastSet = e.sets[e.sets.length - 1];
      const newSet: WorkoutSet = {
        id: generateId(),
        weight: lastSet?.weight || 0,
        reps: lastSet?.reps || 0,
      };
      return { ...e, sets: [...e.sets, newSet] };
    });
    save({ ...workout, exercises });
  };

  const updateSet = (
    exId: string,
    setId: string,
    field: "weight" | "reps",
    value: number
  ) => {
    if (!workout) return;
    const exercises = workout.exercises.map((e) => {
      if (e.id !== exId) return e;
      const sets = e.sets.map((s) =>
        s.id === setId ? { ...s, [field]: value } : s
      );
      return { ...e, sets };
    });
    save({ ...workout, exercises });
  };

  const deleteSet = (exId: string, setId: string) => {
    if (!workout) return;
    const exercises = workout.exercises.map((e) => {
      if (e.id !== exId) return e;
      return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
    });
    save({ ...workout, exercises });
  };

  const deleteExercise = (exId: string) => {
    if (!workout) return;
    save({
      ...workout,
      exercises: workout.exercises.filter((e) => e.id !== exId),
    });
    if (expandedExercise === exId) setExpandedExercise(null);
  };

  const replaceExercise = (exId: string, newName: string) => {
    if (!workout) return;
    const isGravitron = getExerciseIsGravitron(newName);
    const prefilled = prefillSetsFromPR(newName);
    const exercises = workout.exercises.map((e) =>
      e.id === exId ? { ...e, name: newName, isGravitron, sets: prefilled } : e
    );
    save({ ...workout, exercises });
    setReplaceSheetExId(null);
  };

  if (!workout) return null;

  const isExpanded = (exId: string) => expandedExercise === exId;

  return (
    <div className="min-h-screen pb-8 safe-top">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <div className="flex items-center justify-between">
          <Input
            value={workout.name || ""}
            onChange={(e) => updateWorkoutName(e.target.value)}
            placeholder="Название тренировки"
            className="h-10 text-base font-semibold bg-transparent border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 flex-1"
          />
          <button
            onClick={() => navigate("/")}
            className="gym-touch flex items-center justify-center text-muted-foreground ml-3"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-5 pt-4 space-y-3">
        <AnimatePresence>
          {workout.exercises.map((ex) => {
            const pr = ex.name
              ? getExercisePR(ex.name)
              : { weight: 0, reps: 0, isGravitron: false, allSets: [] };
            const expanded = isExpanded(ex.id);

            return (
              <motion.div
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -200 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                {expanded ? (
                  /* ===== EXPANDED VIEW ===== */
                  <ExpandedExercise
                    ex={ex}
                    pr={pr}
                    activeInput={activeInput}
                    suggestions={suggestions}
                    onNameChange={(name) => updateExerciseName(ex.id, name)}
                    onFocus={() => setActiveInput(ex.id)}
                    onBlur={() =>
                      setTimeout(() => {
                        setActiveInput(null);
                        setSuggestions([]);
                      }, 200)
                    }
                    onSelectSuggestion={(name) =>
                      selectSuggestion(ex.id, name)
                    }
                    onToggleGravitron={() => toggleGravitron(ex.id)}
                    onDeleteExercise={() => deleteExercise(ex.id)}
                    onReplace={() => setReplaceSheetExId(ex.id)}
                    onAddSet={() => addSet(ex.id)}
                    onUpdateSet={(setId, field, value) =>
                      updateSet(ex.id, setId, field, value)
                    }
                    onDeleteSet={(setId) => deleteSet(ex.id, setId)}
                    onCollapse={() => setExpandedExercise(null)}
                  />
                ) : (
                  /* ===== COMPACT VIEW ===== */
                  <CompactExercise
                    ex={ex}
                    pr={pr}
                    onExpand={() => setExpandedExercise(ex.id)}
                    onDelete={() => deleteExercise(ex.id)}
                    onReplace={() => setReplaceSheetExId(ex.id)}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add exercise */}
        <Button
          onClick={addExercise}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold border-dashed border-2 gap-2"
        >
          <Plus className="w-5 h-5" />
          Добавить упражнение
        </Button>
      </div>

      {/* Replace exercise sheet */}
      <ReplaceExerciseSheet
        open={replaceSheetExId !== null}
        onOpenChange={(open) => !open && setReplaceSheetExId(null)}
        currentExerciseName={
          workout.exercises.find((e) => e.id === replaceSheetExId)?.name || ""
        }
        onSelect={(name) => replaceExercise(replaceSheetExId!, name)}
      />
    </div>
  );
}

/* ===== Compact Exercise Component ===== */
function CompactExercise({
  ex,
  pr,
  onExpand,
  onDelete,
}: {
  ex: Exercise;
  pr: { weight: number; reps: number; isGravitron: boolean; allSets: { weight: number; reps: number }[] };
  onExpand: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={onExpand}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">
            {ex.name || "Без названия"}
          </span>
          {pr.weight > 0 && (
            <Trophy className="w-3.5 h-3.5 text-accent shrink-0" />
          )}
        </div>

        {/* Compact sets display */}
        {ex.sets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {ex.sets.map((s, i) => (
              <span
                key={s.id}
                className="text-xs bg-secondary/70 text-muted-foreground rounded-md px-2 py-0.5 font-medium"
              >
                {ex.isGravitron ? "-" : ""}{s.weight}×{s.reps}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="gym-touch flex items-center justify-center text-muted-foreground/40 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
      </div>
    </div>
  );
}

/* ===== Expanded Exercise Component ===== */
function ExpandedExercise({
  ex,
  pr,
  activeInput,
  suggestions,
  onNameChange,
  onFocus,
  onBlur,
  onSelectSuggestion,
  onToggleGravitron,
  onDeleteExercise,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onCollapse,
}: {
  ex: Exercise;
  pr: { weight: number; reps: number; isGravitron: boolean; allSets: { weight: number; reps: number }[] };
  activeInput: string | null;
  suggestions: string[];
  onNameChange: (name: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelectSuggestion: (name: string) => void;
  onToggleGravitron: () => void;
  onDeleteExercise: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, field: "weight" | "reps", value: number) => void;
  onDeleteSet: (setId: string) => void;
  onCollapse: () => void;
}) {
  return (
    <>
      {/* Exercise name input */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={ex.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Название упражнения"
              className="h-12 text-base font-semibold bg-secondary/50 border-none rounded-xl"
              onFocus={onFocus}
              onBlur={onBlur}
            />

            {/* Suggestions */}
            {activeInput === ex.id && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl overflow-hidden z-50 shadow-xl">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => onSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-secondary/50 capitalize"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onCollapse}
            className="gym-touch flex items-center justify-center text-muted-foreground"
          >
            <ChevronDown className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={onDeleteExercise}
            className="gym-touch flex items-center justify-center text-muted-foreground"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        {/* Gravitron toggle */}
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`grav-${ex.id}`}
            checked={ex.isGravitron || false}
            onCheckedChange={onToggleGravitron}
            className="h-5 w-5 rounded"
          />
          <label
            htmlFor={`grav-${ex.id}`}
            className="text-xs text-muted-foreground cursor-pointer"
          >
            На гравитроне
          </label>
        </div>
        {/* PR badge */}
        {pr.weight > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Trophy className="w-4 h-4 text-accent shrink-0" />
            {pr.allSets.map((s, i) => (
              <span
                key={i}
                className="text-xs bg-accent/10 text-accent rounded-lg px-2 py-1 font-medium"
              >
                {pr.isGravitron ? "-" : ""}
                {s.weight}×{s.reps}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sets */}
      {ex.sets.length > 0 && (
        <div className="px-4">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium mb-1 px-1">
            <span>#</span>
            <span>Вес (кг)</span>
            <span>Повтор.</span>
            <span></span>
          </div>
          <div className="space-y-1.5">
            {ex.sets.map((s, i) => (
              <SwipeToDelete key={s.id} onDelete={() => onDeleteSet(s.id)}>
                <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center py-1 px-1">
                  <span className="text-sm text-muted-foreground font-medium">
                    {i + 1}
                  </span>
                  <input
                    type={ex.isGravitron ? "text" : "number"}
                    inputMode="decimal"
                    value={
                      s.weight
                        ? `${ex.isGravitron ? "-" : ""}${s.weight}`
                        : ex.isGravitron
                        ? "-"
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/-/g, "")
                        .replace(/[^0-9.]/g, "");
                      onUpdateSet(s.id, "weight", parseFloat(raw) || 0);
                    }}
                    className="h-11 w-full rounded-lg bg-secondary/50 text-center text-base font-medium border-none outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps || ""}
                    onChange={(e) =>
                      onUpdateSet(s.id, "reps", parseInt(e.target.value) || 0)
                    }
                    className="h-11 w-full rounded-lg bg-secondary/50 text-center text-base font-medium border-none outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => onDeleteSet(s.id)}
                    className="gym-touch flex items-center justify-center text-muted-foreground/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </SwipeToDelete>
            ))}
          </div>
        </div>
      )}

      {/* Add set button */}
      <div className="p-3">
        <button
          onClick={onAddSet}
          className="w-full h-11 rounded-xl bg-secondary/50 text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5 active:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить подход
        </button>
      </div>
    </>
  );
}
