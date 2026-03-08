import { Dumbbell, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToExcel } from "@/lib/export";
import { getWorkouts, saveWorkouts, getBodyWeight, saveBodyWeight } from "@/lib/storage";
import { useState } from "react";

export default function Profile() {
  const [cleared, setCleared] = useState(false);
  const [bodyWeight, setBodyWeight] = useState(() => getBodyWeight());
  const workouts = getWorkouts();

  const handleBodyWeightChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setBodyWeight(num);
    saveBodyWeight(num);
  };

  const totalWorkouts = workouts.length;
  const totalExercises = new Set(
    workouts.flatMap((w) => w.exercises.map((e) => e.name.toLowerCase()))
  ).size;
  const totalVolume = workouts.reduce(
    (acc, w) =>
      acc +
      w.exercises.reduce(
        (a, e) =>
          a +
          e.sets.reduce((s, set) => {
            if (e.isGravitron && bodyWeight > 0) {
              return s + Math.max(0, bodyWeight - set.weight) * set.reps;
            }
            return s + set.weight * set.reps;
          }, 0),
        0
      ),
    0
  );

  const clearAll = () => {
    if (confirm("Удалить все данные тренировок? Это действие необратимо.")) {
      saveWorkouts([]);
      setCleared(true);
    }
  };

  return (
    <div className="min-h-screen pb-24 safe-top">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>
      </div>

      {/* Stats cards */}
      <div className="px-5 grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Тренировок", value: cleared ? 0 : totalWorkouts },
          { label: "Упражнений", value: cleared ? 0 : totalExercises },
          {
            label: "Тоннаж",
            value: cleared
              ? "0"
              : totalVolume > 1000
              ? `${(totalVolume / 1000).toFixed(1)}т`
              : `${totalVolume}кг`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-2xl border border-border p-4 text-center"
          >
            <p className="text-2xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Body weight */}
      <div className="px-5 mb-8">
        <div className="bg-card rounded-2xl border border-border p-4">
          <Label htmlFor="bodyWeight" className="text-sm text-muted-foreground">Мой вес (кг)</Label>
          <Input
            id="bodyWeight"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={bodyWeight || ""}
            onChange={(e) => handleBodyWeightChange(e.target.value)}
            className="mt-2 h-12 rounded-xl text-lg font-semibold bg-secondary border-0"
          />
        </div>
      </div>

      <div className="px-5 space-y-3">
        <Button
          onClick={exportToExcel}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold gap-3 justify-start"
          disabled={totalWorkouts === 0 && !cleared}
        >
          <Download className="w-5 h-5" />
          Экспорт в Excel
        </Button>

        <Button
          onClick={clearAll}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold gap-3 justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Trash2 className="w-5 h-5" />
          Удалить все данные
        </Button>
      </div>

      <div className="px-5 mt-10 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/40">
          <Dumbbell className="w-4 h-4" />
          <span className="text-xs">Iron Log v1.0</span>
        </div>
      </div>
    </div>
  );
}
