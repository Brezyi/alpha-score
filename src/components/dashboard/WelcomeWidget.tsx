import { motion } from "framer-motion";
import { Sun, Moon, Sunrise, Sunset, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: "Guten Morgen", icon: Sunrise, gradient: "from-amber-500 to-orange-500" };
  } else if (hour >= 12 && hour < 17) {
    return { text: "Guten Tag", icon: Sun, gradient: "from-yellow-500 to-amber-500" };
  } else if (hour >= 17 && hour < 21) {
    return { text: "Guten Abend", icon: Sunset, gradient: "from-orange-500 to-rose-500" };
  } else {
    return { text: "Gute Nacht", icon: Moon, gradient: "from-indigo-500 to-purple-500" };
  }
};

export function WelcomeWidget() {
  const { profile } = useProfile();
  const greeting = getGreeting();
  const Icon = greeting.icon;
  
  const displayName = profile?.display_name || "Champion";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50"
    >
      {/* Subtle animated background glow */}
      <motion.div
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${greeting.gradient} opacity-10 blur-3xl`}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative flex items-center gap-4">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${greeting.gradient} p-3 flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        
        <div className="flex-1">
          {/* Greeting text with stagger */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            {greeting.text}
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-2xl font-bold tracking-tight flex items-center gap-2"
          >
            {displayName}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.span>
          </motion.h2>
        </div>
      </div>
      
      {/* Motivational subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-3 text-sm text-muted-foreground"
      >
        Bereit für einen weiteren Tag voller Fortschritt? 💪
      </motion.p>
    </motion.div>
  );
}
