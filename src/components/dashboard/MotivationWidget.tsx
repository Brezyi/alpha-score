import { motion } from "framer-motion";
import { Quote, RefreshCw } from "lucide-react";
import { useState } from "react";
import { getDailyQuote, motivationalQuotes } from "@/data/motivationalQuotes";
import { Button } from "@/components/ui/button";

export function MotivationWidget() {
  const [quote, setQuote] = useState(() => getDailyQuote());
  const [isFlipping, setIsFlipping] = useState(false);

  const getRandomQuote = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setQuote(motivationalQuotes[randomIndex]);
      setIsFlipping(false);
    }, 200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
    >
      <div className="absolute top-3 right-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
          onClick={getRandomQuote}
        >
          <RefreshCw className={`w-4 h-4 transition-transform ${isFlipping ? "rotate-180" : ""}`} />
        </Button>
      </div>

      <div className="flex gap-3">
        <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <motion.div
          key={quote.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm font-medium leading-relaxed italic">
            "{quote.text}"
          </p>
          <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
