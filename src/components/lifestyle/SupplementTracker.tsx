import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLifestyle } from "@/hooks/useLifestyle";
import { 
  Pill, 
  Plus, 
  Check, 
  Loader2,
  X,
  Clock,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface SupplementTrackerProps {
  className?: string;
}

const categoryColors: Record<string, string> = {
  vitamin: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  mineral: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  amino: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  herb: "bg-green-500/20 text-green-400 border-green-500/30",
  omega: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  performance: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  skincare: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  custom: "bg-muted text-muted-foreground border-border",
  general: "bg-muted text-muted-foreground border-border",
};

export function SupplementTracker({ className }: SupplementTrackerProps) {
  const { supplements, todaySupplements, loading, logSupplement, deleteSupplementLog, createCustomSupplement } = useLifestyle();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState("");
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleLogSupplement = async (supplementId: string) => {
    setLoggingId(supplementId);
    await logSupplement(supplementId);
    setLoggingId(null);
  };

  const handleCreateSupplement = async () => {
    if (!newSupplementName.trim()) return;
    setCreating(true);
    const result = await createCustomSupplement(newSupplementName.trim());
    if (result) {
      setNewSupplementName("");
      setShowAddDialog(false);
    }
    setCreating(false);
  };

  const handleDeleteLog = async () => {
    if (!deleteLogId) return;
    setDeleting(true);
    await deleteSupplementLog(deleteLogId);
    setDeleting(false);
    setDeleteLogId(null);
  };

  const isTakenToday = (supplementId: string) => {
    return todaySupplements.some(s => s.supplement_id === supplementId);
  };

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group supplements by category
  const groupedSupplements = supplements.reduce((acc, s) => {
    const category = s.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(s);
    return acc;
  }, {} as Record<string, typeof supplements>);

  const categoryLabels: Record<string, string> = {
    vitamin: "Vitamine",
    mineral: "Mineralstoffe",
    amino: "Aminosäuren",
    herb: "Kräuter",
    omega: "Omega-Fettsäuren",
    performance: "Performance",
    skincare: "Hautpflege",
    custom: "Eigene",
    general: "Sonstige"
  };

  return (
    <>
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="w-5 h-5 text-primary" />
              Supplements
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Eigenes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eigenes Supplement hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Name des Supplements"
                    value={newSupplementName}
                    onChange={(e) => setNewSupplementName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateSupplement()}
                  />
                  <Button 
                    onClick={handleCreateSupplement} 
                    className="w-full"
                    disabled={creating || !newSupplementName.trim()}
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Hinzufügen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Today's Log - with delete option */}
          {todaySupplements.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Heute eingenommen</span>
                <Badge variant="outline" className="ml-auto">
                  {todaySupplements.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {todaySupplements.map((log) => (
                  <div 
                    key={log.id} 
                    className="group flex items-center gap-1.5 bg-background/50 rounded-md px-2 py-1 border border-border"
                  >
                    <span className="text-sm">{log.supplement?.name || "Unbekannt"}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.taken_at), "HH:mm")}
                    </span>
                    <button
                      onClick={() => setDeleteLogId(log.id)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
                    >
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplement List */}
          <ScrollArea className="h-[250px] pr-2">
            <div className="space-y-4">
              {Object.entries(groupedSupplements).map(([category, supps]) => (
                <div key={category}>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {categoryLabels[category] || category}
                  </div>
                  <div className="grid gap-2">
                    <AnimatePresence>
                      {supps.map((supplement) => {
                        const taken = isTakenToday(supplement.id);
                        const isLogging = loggingId === supplement.id;
                        
                        return (
                          <motion.div
                            key={supplement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-lg border transition-all",
                              taken 
                                ? "bg-primary/5 border-primary/20" 
                                : "bg-card border-border hover:border-primary/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] px-1.5", categoryColors[category])}
                              >
                                {supplement.default_dosage || "1x"}
                              </Badge>
                              <span className={cn(
                                "text-sm font-medium",
                                taken && "text-primary"
                              )}>
                                {supplement.name}
                              </span>
                            </div>
                            <Button
                              variant={taken ? "ghost" : "outline"}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleLogSupplement(supplement.id)}
                              disabled={isLogging}
                            >
                              {isLogging ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : taken ? (
                                <Check className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLogId} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diesen Supplement-Eintrag wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLog}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
