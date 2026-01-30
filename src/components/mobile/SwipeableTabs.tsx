import { ReactNode, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

interface SwipeableTabsProps {
  tabs: {
    key: string;
    label: string;
    content: ReactNode;
  }[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  disabled = false
}: SwipeableTabsProps) {
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentIndex = tabs.findIndex(t => t.key === activeTab);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
  }, []);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (disabled) return;
    
    const swipeThreshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Swipe left (next tab)
    if ((offset < -swipeThreshold || velocity < -500) && currentIndex < tabs.length - 1) {
      setDirection(1);
      await triggerHaptic();
      onTabChange(tabs[currentIndex + 1].key);
    }
    // Swipe right (previous tab)
    else if ((offset > swipeThreshold || velocity > 500) && currentIndex > 0) {
      setDirection(-1);
      await triggerHaptic();
      onTabChange(tabs[currentIndex - 1].key);
    }
  }, [currentIndex, tabs, onTabChange, triggerHaptic, disabled]);

  // Update direction when tab changes programmatically
  useEffect(() => {
    const newIndex = tabs.findIndex(t => t.key === activeTab);
    if (newIndex > currentIndex) {
      setDirection(1);
    } else if (newIndex < currentIndex) {
      setDirection(-1);
    }
  }, [activeTab]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0
    })
  };

  const currentTab = tabs.find(t => t.key === activeTab);

  return (
    <div className={cn("overflow-hidden", className)} ref={containerRef}>
      {/* Tab Headers */}
      <div className="flex border-b border-border mb-4 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const newIndex = tabs.findIndex(t => t.key === tab.key);
              setDirection(newIndex > currentIndex ? 1 : -1);
              onTabChange(tab.key);
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors relative",
              activeTab === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content with Swipe */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag={disabled ? false : "x"}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="touch-pan-x"
        >
          {currentTab?.content}
        </motion.div>
      </AnimatePresence>

      {/* Swipe Indicators (dots) */}
      {tabs.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                onTabChange(tab.key);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                activeTab === tab.key
                  ? "bg-primary w-4"
                  : "bg-muted-foreground/30"
              )}
              aria-label={`Go to ${tab.label}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
