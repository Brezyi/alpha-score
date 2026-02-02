import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { HelpCenterDialog } from "./HelpCenterDialog";
import { cn } from "@/lib/utils";

interface HelpFABProps {
  onStartTour: () => void;
  className?: string;
}

export function HelpFAB({ onStartTour, className }: HelpFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(() => {
    // Only pulse for new users who haven't seen the help
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
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        onClick={handleOpen}
        className={cn(
          "fixed z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-transform",
          "bottom-20 right-4 sm:bottom-6 sm:right-6",
          className
        )}
        aria-label="Hilfe öffnen"
      >
        <HelpCircle className="w-5 h-5" />
        
        {/* Pulse animation for new users */}
        <AnimatePresence>
          {isPulsing && (
            <motion.span
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeOut" 
              }}
              className="absolute inset-0 rounded-full bg-primary"
            />
          )}
        </AnimatePresence>
      </motion.button>

      <HelpCenterDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onStartTour={onStartTour}
      />
    </>
  );
}
