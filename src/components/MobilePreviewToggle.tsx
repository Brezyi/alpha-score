import { Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { Capacitor } from "@capacitor/core";
import { motion, AnimatePresence } from "framer-motion";

export const MobilePreviewToggle = () => {
  const { isMobilePreview, toggleMobilePreview } = useNativePlatform();
  
  // Don't show on actual native platforms
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-[9999]"
    >
      <Button
        onClick={toggleMobilePreview}
        variant={isMobilePreview ? "default" : "outline"}
        size="sm"
        className="gap-2 shadow-lg backdrop-blur-sm border-primary/20"
      >
        <AnimatePresence mode="wait">
          {isMobilePreview ? (
            <motion.div
              key="mobile"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              <span>Mobile Preview</span>
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              <span>Desktop</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};
