import * as XLSX from "xlsx";
import { getWorkouts, getBodyWeight } from "./storage";
import { toast } from "sonner";

export function exportToExcel() {
  try {
    const workouts = getWorkouts();
    const bodyWeight = getBodyWeight();
    const rows: Record<string, string | number>[] = [];

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((s, i) => {
          let tonnage: number;
          if (ex.isGravitron && bodyWeight > 0) {
            tonnage = Math.max(0, bodyWeight - s.weight) * s.reps;
          } else {
            tonnage = s.weight * s.reps;
          }
          rows.push({
            Дата: new Date(w.date).toLocaleDateString("ru-RU"),
            Тренировка: w.name || "",
            Упражнение: ex.name,
            Гравитрон: ex.isGravitron ? "Да" : "",
            Подход: i + 1,
            "Вес (кг)": s.weight,
            Повторения: s.reps,
            Тоннаж: tonnage,
          });
        });
      });
    });

    if (rows.length === 0) {
      toast.error("Нет данных для экспорта");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Тренировки");

    ws["!cols"] = [
      { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    ];

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    // Use window.open as fallback for sandboxed environments
    const a = document.createElement("a");
    a.href = url;
    a.download = `тренировки_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    toast.success("Файл экспортирован");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Ошибка при экспорте файла");
  }
}
