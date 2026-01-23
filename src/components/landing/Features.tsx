import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Camera, 
  Brain, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  Shield,
  Sparkles,
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Foto-Analyse",
    description: "Lade 1-3 Fotos hoch und erhalte eine präzise Bewertung deines Aussehens.",
  },
  {
    icon: Brain,
    title: "KI-Bewertung",
    description: "Unsere KI analysiert Gesichtssymmetrie, Jawline, Augen, Haut und mehr.",
  },
  {
    icon: Target,
    title: "Looks Score",
    description: "Erhalte einen objektiven Score von 1-10 mit detaillierter Aufschlüsselung.",
  },
  {
    icon: Sparkles,
    title: "Personalisierter Plan",
    description: "Individuelle Empfehlungen für Skincare, Haare, Fitness und Style.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Verfolge deine Entwicklung mit Vorher/Nachher-Vergleichen und Statistiken.",
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Stelle Fragen an deinen persönlichen Looksmaxing-Berater – 24/7.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden" id="features" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Features</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Alles was du brauchst für <span className="text-gradient">dein Glow-Up</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Moderne Tools, die dir helfen, das Beste aus deinem Aussehen herauszuholen.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300"
            >
              {/* Glow Effect on Hover */}
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              
              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer bg-[length:200%_100%]" />
              </div>
              
              <div className="relative z-10">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badge */}
        <motion.div 
          className="flex items-center justify-center gap-2 mt-16 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm">Deine Daten sind sicher und verschlüsselt</span>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
