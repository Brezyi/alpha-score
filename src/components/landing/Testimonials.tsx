import { Quote, MessageSquare } from "lucide-react";
import { useGlobalSettings } from "@/contexts/SystemSettingsContext";
import { useTestimonials } from "@/hooks/useTestimonials";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/StarRating";

const Testimonials = () => {
  const { settings } = useGlobalSettings();
  const { testimonials, loading } = useTestimonials();

  // Don't render section if no approved testimonials
  if (!loading && testimonials.length === 0) {
    return null;
  }

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

        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl glass-card">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-20 w-full mb-6" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials Grid */}
        {!loading && testimonials.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => {
              const scoreDiff = testimonial.score_before && testimonial.score_after
                ? testimonial.score_after - testimonial.score_before
                : null;
              // Only show score improvement if it's actually positive
              const scoreImprovement = scoreDiff && scoreDiff > 0 ? scoreDiff.toFixed(1) : null;

              return (
                <div
                  key={testimonial.id}
                  className="relative p-6 rounded-2xl glass-card hover:border-primary/30 transition-all duration-300"
                >
                  {/* Quote Icon */}
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />

                  {/* Rating */}
                  <div className="mb-4">
                    <StarRating 
                      rating={testimonial.star_rating ?? 5} 
                      size="sm" 
                    />
                  </div>

                  {/* Text */}
                  <p className="text-muted-foreground mb-6 relative z-10">
                    "{testimonial.testimonial_text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {testimonial.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.display_name}</div>
                        {testimonial.age && (
                          <div className="text-sm text-muted-foreground">
                            {testimonial.age} Jahre
                          </div>
                        )}
                      </div>
                    </div>
                    {scoreImprovement && (
                      <div className="text-right">
                        <div className="text-xl font-bold text-gradient">
                          +{scoreImprovement}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state - shown only if not loading */}
        {!loading && testimonials.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Noch keine Bewertungen vorhanden.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
