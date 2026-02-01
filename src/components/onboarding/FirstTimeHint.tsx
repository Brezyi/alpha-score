import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FirstTimeHintProps {
  show: boolean;
  onDismiss: () => void;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

export function FirstTimeHint({
  show,
  onDismiss,
  title,
  description,
  position = "bottom",
  className,
  delay = 500,
}: FirstTimeHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, delay]);

  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  const arrowClasses = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45",
    bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45",
    left: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rotate-45",
    right: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: position === "bottom" ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "absolute z-50 w-64",
            positionClasses[position],
            className
          )}
        >
          {/* Card */}
          <div className="relative bg-card border border-primary/30 rounded-xl shadow-xl p-4">
            {/* Arrow */}
            <div className={cn(
              "absolute w-3 h-3 bg-card border-l border-t border-primary/30",
              arrowClasses[position]
            )} />

            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">{title}</h4>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {description}
            </p>

            {/* Dismiss button */}
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="w-full text-xs h-8"
            >
              Verstanden
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
