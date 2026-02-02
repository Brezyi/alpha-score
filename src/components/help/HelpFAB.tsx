import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Sparkles } from "lucide-react";
import { HelpCenterDialog } from "./HelpCenterDialog";
import { cn } from "@/lib/utils";

interface HelpFABProps {
  onStartTour: () => void;
  className?: string;
}

export function HelpFAB({ onStartTour, className }: HelpFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(() => {
    try {
      const hasSeen = localStorage.getItem("help-fab-seen");
      return !hasSeen;
    } catch {
      return true;
    }
  });

  const handleOpen = () => {
    setIsOpen(true);
    setIsPulsing(false);
    try {
      localStorage.setItem("help-fab-seen", "true");
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <>
      {/* Main FAB Container */}
      <div 
        className={cn(
          "fixed z-40 bottom-20 right-4 sm:bottom-6 sm:right-6",
          className
        )}
      >
        {/* Tooltip on hover */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl px-3 py-2 shadow-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium">Hilfe & Tour</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer glow rings for new users */}
        <AnimatePresence>
          {isPulsing && (
            <>
              {/* Ring 1 */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/50"
              />
              {/* Ring 2 - delayed */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/50"
              />
            </>
          )}
        </AnimatePresence>

        {/* Main Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary via-primary to-primary/80",
            "shadow-[0_4px_20px_rgba(var(--primary),0.4)]",
            "border border-white/20",
            "transition-shadow duration-300",
            isHovered && "shadow-[0_6px_30px_rgba(var(--primary),0.6)]"
          )}
          aria-label="Hilfe öffnen"
        >
          {/* Glass overlay effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30 opacity-50" />
          
          {/* Icon with subtle animation */}
          <motion.div
            animate={isPulsing ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: isPulsing ? Infinity : 0, repeatDelay: 2 }}
          >
            <HelpCircle className="w-6 h-6 text-primary-foreground relative z-10" />
          </motion.div>

          {/* New badge for first-time users */}
          <AnimatePresence>
            {isPulsing && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center shadow-lg"
              >
                <span className="text-[10px] font-bold text-destructive-foreground">!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <HelpCenterDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onStartTour={onStartTour}
      />
    </>
  );
}
