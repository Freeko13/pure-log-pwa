import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { getExerciseHistory } from "@/lib/storage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MetricType = "weight" | "volume";

export default function ExerciseStats() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [metric, setMetric] = useState<MetricType>("weight");

  const decodedName = decodeURIComponent(name || "");
  const history = getExerciseHistory(decodedName);

  const chartData = history.entries.map((e) => ({
    date: new Date(e.date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    }),
    value: metric === "weight" ? e.maxWeight : e.totalVolume,
  }));

  return (
    <div className="min-h-screen safe-top">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-5 py-3 flex items-center gap-3 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="gym-touch flex items-center justify-center text-muted-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg capitalize truncate">{decodedName}</h1>
      </div>

      <div className="px-5 pt-6">
        {/* PR */}
        {history.pr > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5 mb-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Личный рекорд</p>
                <p className="text-2xl font-bold">{history.isGravitron ? "-" : ""}{history.pr} кг × {history.prReps}</p>
              </div>
            </div>
            {history.prAllSets && history.prAllSets.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {history.prAllSets.map((s, i) => (
                  <span key={i} className="text-xs bg-accent/10 text-accent rounded-lg px-2.5 py-1.5 font-medium">
                    {history.isGravitron ? "-" : ""}{s.weight} кг × {s.reps}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metric toggle */}
        <div className="flex gap-2 mb-4">
          {(["weight", "volume"] as MetricType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                metric === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {m === "weight" ? "Макс. вес" : "Тоннаж"}
            </button>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220 14% 18%)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                  reversed={history.isGravitron && metric === "weight"}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(220 20% 10%)",
                    border: "1px solid hsl(220 14% 18%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [
                    `${value.toLocaleString()} ${metric === "weight" ? "кг" : "кг"}`,
                    metric === "weight" ? "Макс. вес" : "Тоннаж",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(145 72% 45%)"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(145 72% 45%)", r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(145 72% 45%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">
            Нет данных для графика
          </p>
        )}
      </div>
    </div>
  );
}
