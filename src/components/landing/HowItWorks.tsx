import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Cpu, FileText, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Fotos hochladen",
    description: "Lade 1-3 klare Fotos hoch – Frontal, Seite und optional Körper.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "KI-Analyse",
    description: "Unsere KI analysiert über 20 Gesichts- und Körpermerkmale.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Ergebnisse erhalten",
    description: "Du erhältst deinen Looks Score, Stärken und Schwächen.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Plan umsetzen",
    description: "Folge deinem personalisierten Looksmax-Plan und tracke den Fortschritt.",
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden" id="how-it-works" ref={ref}>
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            So <span className="text-gradient">funktioniert's</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            In 4 einfachen Schritten zu deinem optimierten Aussehen.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <motion.div 
            className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px hidden md:block overflow-hidden"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
          >
            <motion.div
              className="w-full h-full bg-gradient-to-b from-primary via-primary/50 to-transparent"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
            />
          </motion.div>
          
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Step Number & Icon */}
                <motion.div 
                  className="relative z-10 flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center glow-box">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <motion.div 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ type: "spring", delay: 0.4 + index * 0.15 }}
                  >
                    {step.number}
                  </motion.div>
                </motion.div>

                {/* Content */}
                <motion.div 
                  className={`flex-1 text-center md:text-left ${index % 2 !== 0 ? "md:text-right" : ""}`}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.15 }}
                >
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto md:mx-0">
                    {step.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
