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
import { ArrowLeft, Check, X, Star, Eye, EyeOff, Trash2, RotateCcw } from "lucide-react";
import { useAdminTestimonials } from "@/hooks/useTestimonials";
import { useToast } from "@/hooks/use-toast";

export default function TestimonialsManagement() {
  const { testimonials, loading, approveTestimonial, featureTestimonial, restoreTestimonial, permanentlyDeleteTestimonial } = useAdminTestimonials();
  const { toast } = useToast();
  const [selectedTestimonial, setSelectedTestimonial] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "restore" | "delete" | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "trash">("all");

  // Filter out deleted testimonials for non-trash views
  const activeTestimonials = testimonials.filter((t) => !t.deleted_at);
  const trashedTestimonials = testimonials.filter((t) => t.deleted_at);

  const filteredTestimonials = filter === "trash" 
    ? trashedTestimonials
    : activeTestimonials.filter((t) => {
        if (filter === "pending") return !t.is_approved;
        if (filter === "approved") return t.is_approved;
        return true;
      });

  // Calculate days until permanent deletion for trashed items
  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  const handleAction = async () => {
    if (!selectedTestimonial || !actionType) return;

    try {
      if (actionType === "approve") {
        await approveTestimonial(selectedTestimonial, true);
        toast({
          title: "Freigegeben",
          description: "Bewertung wurde freigegeben.",
        });
      } else if (actionType === "reject") {
        await approveTestimonial(selectedTestimonial, false);
        toast({
          title: "In Papierkorb verschoben",
          description: "Bewertung wurde abgelehnt und in den Papierkorb verschoben.",
        });
      } else if (actionType === "restore") {
        await restoreTestimonial(selectedTestimonial);
        toast({
          title: "Wiederhergestellt",
          description: "Bewertung wurde wiederhergestellt.",
        });
      } else if (actionType === "delete") {
        await permanentlyDeleteTestimonial(selectedTestimonial);
        toast({
          title: "Endgültig gelöscht",
          description: "Bewertung wurde unwiderruflich gelöscht.",
        });
      }
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
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Alle ({activeTestimonials.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Ausstehend ({activeTestimonials.filter((t) => !t.is_approved).length})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("approved")}
          >
            Freigegeben ({activeTestimonials.filter((t) => t.is_approved).length})
          </Button>
          <Button
            variant={filter === "trash" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("trash")}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Papierkorb ({trashedTestimonials.length})
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Gesamt</div>
            <div className="text-2xl font-bold">{activeTestimonials.length}</div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Ausstehend</div>
            <div className="text-2xl font-bold text-yellow-500">
              {activeTestimonials.filter((t) => !t.is_approved).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Freigegeben</div>
            <div className="text-2xl font-bold text-green-500">
              {activeTestimonials.filter((t) => t.is_approved).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Hervorgehoben</div>
            <div className="text-2xl font-bold text-primary">
              {activeTestimonials.filter((t) => t.is_featured).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground">Im Papierkorb</div>
            <div className="text-2xl font-bold text-destructive">
              {trashedTestimonials.length}
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
          ) : filteredTestimonials.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {filter === "all" 
                ? "Noch keine Bewertungen vorhanden."
                : filter === "pending"
                  ? "Keine ausstehenden Bewertungen."
                  : filter === "approved"
                    ? "Keine freigegebenen Bewertungen."
                    : "Papierkorb ist leer."}
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
                {filteredTestimonials.map((testimonial) => (
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
                      <div className="flex flex-wrap gap-1">
                        {testimonial.deleted_at ? (
                          <Badge variant="destructive">
                            Gelöscht ({getDaysRemaining(testimonial.deleted_at)} Tage)
                          </Badge>
                        ) : (
                          <>
                            <Badge variant={testimonial.is_approved ? "default" : "secondary"}>
                              {testimonial.is_approved ? "Freigegeben" : "Ausstehend"}
                            </Badge>
                            {testimonial.is_featured && (
                              <Badge variant="outline" className="border-primary text-primary">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {testimonial.deleted_at ? (
                          // Trash view actions
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500 hover:text-green-600"
                              onClick={() => {
                                setSelectedTestimonial(testimonial.id);
                                setActionType("restore");
                              }}
                              title="Wiederherstellen"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive/80"
                              onClick={() => {
                                setSelectedTestimonial(testimonial.id);
                                setActionType("delete");
                              }}
                              title="Endgültig löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          // Normal view actions
                          <>
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
                          </>
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
              {actionType === "approve" && "Bewertung freigeben?"}
              {actionType === "reject" && "Bewertung ablehnen?"}
              {actionType === "restore" && "Bewertung wiederherstellen?"}
              {actionType === "delete" && "Endgültig löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" && "Die Bewertung wird auf der Landingpage angezeigt."}
              {actionType === "reject" && "Die Bewertung wird in den Papierkorb verschoben und kann 30 Tage lang wiederhergestellt werden."}
              {actionType === "restore" && "Die Bewertung wird wiederhergestellt und erscheint wieder als 'Ausstehend'."}
              {actionType === "delete" && "Diese Aktion kann nicht rückgängig gemacht werden. Die Bewertung wird unwiderruflich gelöscht."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              className={actionType === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {actionType === "approve" && "Freigeben"}
              {actionType === "reject" && "Ablehnen"}
              {actionType === "restore" && "Wiederherstellen"}
              {actionType === "delete" && "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
