import { useState } from "react";
import { motion, useMotionValue, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -60) {
      setRevealed(true);
      x.set(-80);
    } else {
      setRevealed(false);
      x.set(0);
    }
  };

  const handleDeleteClick = () => {
    onDelete();
  };

  const handleDragStart = () => {
    // reset if dragging again
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete button behind */}
      <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-destructive">
        <button
          onClick={handleDeleteClick}
          className="flex flex-col items-center gap-1 text-destructive-foreground"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-xs font-medium">Удалить</span>
        </button>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
