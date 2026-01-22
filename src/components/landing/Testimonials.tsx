import { Star, Quote } from "lucide-react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";

const testimonials = [
  {
    name: "Maximilian K.",
    age: 24,
    score: "+2.1",
    avatar: "M",
    text: "Nach 3 Monaten mit dem Plan bin ich von 5.8 auf 7.9 gekommen. Die Skincare-Routine und Jawline-Übungen haben echt was gebracht.",
    rating: 5,
  },
  {
    name: "David R.",
    age: 19,
    score: "+1.8",
    avatar: "D",
    text: "Endlich eine App, die mir direkt sagt, was ich verbessern kann. Der AI Coach ist mega hilfreich.",
    rating: 5,
  },
  {
    name: "Leon S.",
    age: 28,
    score: "+2.5",
    avatar: "L",
    text: "Hab durch die App erst verstanden, welche Frisur zu meiner Gesichtsform passt. Kompletter Gamechanger.",
    rating: 5,
  },
];

const Testimonials = () => {
  const { settings } = useGlobalSettings();
  
  return (
    <section className="relative py-24 overflow-hidden" id="testimonials">
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Echte <span className="text-gradient">Ergebnisse</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Was unsere Nutzer über {settings.app_name} sagen.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="relative p-6 rounded-2xl glass-card hover:border-primary/30 transition-all duration-300"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground mb-6 relative z-10">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.age} Jahre</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gradient">{testimonial.score}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;