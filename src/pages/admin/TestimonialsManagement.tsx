import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, X, Star, Eye, EyeOff } from "lucide-react";
import { useAdminTestimonials } from "@/hooks/useTestimonials";
import { useToast } from "@/hooks/use-toast";

export default function TestimonialsManagement() {
  const { testimonials, loading, approveTestimonial, featureTestimonial } = useAdminTestimonials();
  const { toast } = useToast();
  const [selectedTestimonial, setSelectedTestimonial] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const handleAction = async () => {
    if (!selectedTestimonial || !actionType) return;

    try {
      await approveTestimonial(selectedTestimonial, actionType === "approve");
      toast({
        title: actionType === "approve" ? "Freigegeben" : "Abgelehnt",
        description: `Bewertung wurde ${actionType === "approve" ? "freigegeben" : "abgelehnt"}.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aktion konnte nicht ausgeführt werden.",
        variant: "destructive",
      });
    }
    setSelectedTestimonial(null);
    setActionType(null);
  };

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    try {
      await featureTestimonial(id, !currentlyFeatured);
      toast({
        title: !currentlyFeatured ? "Hervorgehoben" : "Entfernt",
        description: !currentlyFeatured
          ? "Bewertung wird jetzt hervorgehoben."
          : "Hervorhebung wurde entfernt.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aktion konnte nicht ausgeführt werden.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center gap-4 h-16">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Bewertungen verwalten</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Gesamt</div>
            <div className="text-2xl font-bold">{testimonials.length}</div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Ausstehend</div>
            <div className="text-2xl font-bold text-yellow-500">
              {testimonials.filter((t) => !t.is_approved).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Freigegeben</div>
            <div className="text-2xl font-bold text-green-500">
              {testimonials.filter((t) => t.is_approved).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Hervorgehoben</div>
            <div className="text-2xl font-bold text-primary">
              {testimonials.filter((t) => t.is_featured).length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Noch keine Bewertungen vorhanden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nutzer</TableHead>
                  <TableHead>Bewertung</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{testimonial.display_name}</div>
                        {testimonial.age && (
                          <div className="text-sm text-muted-foreground">
                            {testimonial.age} Jahre
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-muted-foreground">
                        "{testimonial.testimonial_text}"
                      </p>
                    </TableCell>
                    <TableCell>
                      {testimonial.score_before && testimonial.score_after ? (
                        <span className="text-gradient font-bold">
                          +{(testimonial.score_after - testimonial.score_before).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(testimonial.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={testimonial.is_approved ? "default" : "secondary"}>
                          {testimonial.is_approved ? "Freigegeben" : "Ausstehend"}
                        </Badge>
                        {testimonial.is_featured && (
                          <Badge variant="outline" className="border-primary text-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!testimonial.is_approved && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500 hover:text-green-600"
                              onClick={() => {
                                setSelectedTestimonial(testimonial.id);
                                setActionType("approve");
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                setSelectedTestimonial(testimonial.id);
                                setActionType("reject");
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {testimonial.is_approved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleToggleFeatured(testimonial.id, testimonial.is_featured)
                            }
                          >
                            {testimonial.is_featured ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!selectedTestimonial && !!actionType}
        onOpenChange={() => {
          setSelectedTestimonial(null);
          setActionType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Bewertung freigeben?" : "Bewertung ablehnen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "Die Bewertung wird auf der Landingpage angezeigt."
                : "Die Bewertung bleibt gespeichert, wird aber nicht angezeigt."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {actionType === "approve" ? "Freigeben" : "Ablehnen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
