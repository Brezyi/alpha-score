import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Camera, Droplets, Moon, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  className?: string;
}

export function FloatingActionButton({ 
  actions: customActions,
  className 
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const triggerHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
  };

  const defaultActions: FABAction[] = [
    {
      icon: <Camera className="w-5 h-5" />,
      label: "Neue Analyse",
      onClick: () => navigate("/upload"),
      color: "bg-primary",
    },
    {
      icon: <Droplets className="w-5 h-5" />,
      label: "Wasser tracken",
      onClick: () => navigate("/lifestyle"),
      color: "bg-blue-500",
    },
    {
      icon: <Moon className="w-5 h-5" />,
      label: "Schlaf loggen",
      onClick: () => navigate("/lifestyle"),
      color: "bg-indigo-500",
    },
    {
      icon: <Dumbbell className="w-5 h-5" />,
      label: "Aktivität",
      onClick: () => navigate("/lifestyle"),
      color: "bg-emerald-500",
    },
  ];

  const actions = customActions || defaultActions;

  const toggleOpen = () => {
    triggerHaptic();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: FABAction) => {
    triggerHaptic();
    setIsOpen(false);
    action.onClick();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={cn(
        "fixed right-4 z-50",
        "bottom-24 sm:bottom-8",
        className
      )}>
        {/* Action Buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end">
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.8,
                    transition: { delay: (actions.length - index - 1) * 0.03 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction(action)}
                  className="flex items-center gap-3 group"
                >
                  {/* Label */}
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
                    className="px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-md text-sm font-medium shadow-lg whitespace-nowrap"
                  >
                    {action.label}
                  </motion.span>
                  
                  {/* Icon Button */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg",
                    "transition-transform duration-200",
                    action.color || "bg-primary"
                  )}>
                    {action.icon}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleOpen}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground shadow-lg",
            "shadow-primary/30 hover:shadow-primary/50",
            "transition-shadow duration-200"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
