import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, X, Trophy, Trash2, ArrowLeftRight, GripVertical, Check } from "lucide-react";
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
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
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
  const [reorderMode, setReorderMode] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  useEffect(() => {
    setKnownExercises(getExerciseNames());
    const existing = getWorkouts().find((w) => w.id === id);
    if (existing) {
      setWorkout(existing);
      // All exercises start collapsed
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

  const handleReorder = (newOrder: Exercise[]) => {
    if (!workout) return;
    const updated = { ...workout, exercises: newOrder };
    setWorkout(updated);
    if (isNew) {
      addWorkout(updated);
      setIsNew(false);
    } else {
      updateWorkout(updated);
    }
  };

  const handleLongPressStart = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setReorderMode(true);
      setExpandedExercise(null);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(30);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  if (!workout) return null;

  const isExpanded = (exId: string) => expandedExercise === exId;

  return (
    <div className="min-h-screen pb-8">
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
      <div className={`px-5 pt-4 ${reorderMode ? "pb-20" : ""} space-y-3`}>
        {reorderMode ? (
          <Reorder.Group
            axis="y"
            values={workout.exercises}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {workout.exercises.map((ex) => (
              <DraggableExerciseItem key={ex.id} ex={ex} />
            ))}
          </Reorder.Group>
        ) : (
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
                  onTouchStart={handleLongPressStart}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleLongPressEnd}
                >
                  {expanded ? (
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
                    <CompactExercise
                      ex={ex}
                      pr={pr}
                      onExpand={() => {
                        if (!longPressTriggered.current) setExpandedExercise(ex.id);
                      }}
                      onDelete={() => deleteExercise(ex.id)}
                      onReplace={() => setReplaceSheetExId(ex.id)}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Add exercise - hidden in reorder mode */}
        {!reorderMode && (
          <Button
            onClick={addExercise}
            variant="outline"
            className="w-full h-14 rounded-2xl text-base font-semibold border-dashed border-2 gap-2"
          >
            <Plus className="w-5 h-5" />
            Добавить упражнение
          </Button>
        )}
      </div>

      {/* Floating Done button in reorder mode */}
      {reorderMode && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-5 safe-bottom">
          <Button
            onClick={() => setReorderMode(false)}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-lg"
          >
            <Check className="w-5 h-5" />
            Готово
          </Button>
        </div>
      )}

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

/* ===== Draggable Exercise Item (reorder mode) ===== */
function DraggableExerciseItem({ ex }: { ex: Exercise }) {
  const controls = useDragControls();
  const pr = ex.name
    ? getExercisePR(ex.name)
    : { weight: 0, reps: 0, isGravitron: false, allSets: [] };

  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="bg-card rounded-2xl border border-border overflow-hidden"
      whileDrag={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className="cursor-grab active:cursor-grabbing touch-none p-1"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold break-words block">
            {ex.name || "Без названия"}
          </span>
          {ex.sets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ex.sets.map((s) => (
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
        {pr.weight > 0 && (
          <Trophy className="w-3.5 h-3.5 text-accent shrink-0" />
        )}
      </div>
    </Reorder.Item>
  );
}

/* ===== Compact Exercise Component ===== */
function CompactExercise({
  ex,
  pr,
  onExpand,
  onDelete,
  onReplace,
}: {
  ex: Exercise;
  pr: { weight: number; reps: number; isGravitron: boolean; allSets: { weight: number; reps: number }[] };
  onExpand: () => void;
  onDelete: () => void;
  onReplace: () => void;
}) {
  return (
    <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={onExpand}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-sm font-semibold break-words flex-1 min-w-0">
            {ex.name || "Без названия"}
          </span>
          {pr.weight > 0 && (
            <Trophy className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          )}
        </div>

        {/* Compact sets display */}
        {ex.sets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {ex.sets.map((s) => (
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
            onReplace();
          }}
          className="gym-touch flex items-center justify-center text-muted-foreground/40 p-1"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="gym-touch flex items-center justify-center text-muted-foreground/40 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
  onReplace,
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
  onReplace: () => void;
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
            onClick={onReplace}
            className="gym-touch flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeftRight className="w-5 h-5" />
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

/* ===== Replace Exercise Sheet ===== */
function ReplaceExerciseSheet({
  open,
  onOpenChange,
  currentExerciseName,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExerciseName: string;
  onSelect: (name: string) => void;
}) {
  const allNames = getExerciseNames().filter(
    (n) => n.toLowerCase() !== currentExerciseName.toLowerCase()
  );
  const [search, setSearch] = useState("");
  const filtered = search
    ? allNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : allNames;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0">
        <SheetHeader className="px-5 pb-3">
          <SheetTitle>Заменить упражнение</SheetTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="mt-2 h-11 rounded-xl bg-secondary/50 border-none"
          />
        </SheetHeader>
        <div className="overflow-y-auto flex-1 px-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Упражнения не найдены
            </p>
          )}
          {filtered.map((name) => {
            const pr = getExercisePR(name);
            return (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-secondary/50 active:bg-secondary transition-colors flex items-center justify-between gap-3"
              >
                <span className="text-sm font-medium capitalize truncate">
                  {name}
                </span>
                {pr.weight > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {pr.isGravitron ? "-" : ""}
                      {pr.weight}×{pr.reps}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
