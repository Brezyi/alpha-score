import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Ticket,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Crown,
  Sparkles
} from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  plan_type: string;
  duration_days: number | null;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

export default function PromoCodes() {
  const navigate = useNavigate();
  const { isOwner } = useUserRole();
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form state
  const [newCode, setNewCode] = useState("");
  const [planType, setPlanType] = useState<"premium" | "lifetime">("premium");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast({
        title: "Fehler",
        description: "Codes konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchCodes();
    }
  }, [isOwner]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Code ein",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: newCode.toUpperCase().trim(),
          plan_type: planType,
          duration_days: planType === "lifetime" ? null : parseInt(durationDays),
          max_uses: parseInt(maxUses),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error("Dieser Code existiert bereits");
        }
        throw error;
      }

      toast({
        title: "Code erstellt",
        description: `Promocode ${newCode.toUpperCase()} wurde erstellt`,
      });

      setCreateOpen(false);
      setNewCode("");
      setPlanType("premium");
      setDurationDays("30");
      setMaxUses("1");
      setExpiresAt("");
      fetchCodes();
    } catch (error: any) {
      console.error("Error creating code:", error);
      toast({
        title: "Fehler",
        description: error.message || "Code konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Code gelöscht",
        description: "Der Promocode wurde entfernt",
      });
      
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting code:", error);
      toast({
        title: "Fehler",
        description: "Code konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const toggleCodeActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setCodes(prev => prev.map(c => 
        c.id === id ? { ...c, is_active: !currentActive } : c
      ));

      toast({
        title: currentActive ? "Code deaktiviert" : "Code aktiviert",
      });
    } catch (error) {
      console.error("Error toggling code:", error);
    }
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nur Owner können Promocodes verwalten</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Admin</span>
          </button>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Promocodes</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchCodes}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Neuer Code
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Alle Promocodes ({codes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : codes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Promocodes vorhanden
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Dauer</TableHead>
                      <TableHead>Nutzungen</TableHead>
                      <TableHead>Läuft ab</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-3 h-3 text-primary" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.plan_type === "lifetime" ? (
                            <span className="inline-flex items-center gap-1 text-amber-500">
                              <Sparkles className="w-3 h-3" />
                              Lifetime
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Crown className="w-3 h-3" />
                              Premium
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.plan_type === "lifetime" ? "∞" : `${code.duration_days} Tage`}
                        </TableCell>
                        <TableCell>
                          {code.current_uses} / {code.max_uses}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.expires_at 
                            ? new Date(code.expires_at).toLocaleDateString('de-DE')
                            : "—"
                          }
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleCodeActive(code.id, code.is_active)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              code.is_active 
                                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {code.is_active ? "Aktiv" : "Inaktiv"}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCode(code.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Code Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Promocode erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="z.B. PREMIUM2024"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateRandomCode}>
                  Generieren
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan-Typ</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as "premium" | "lifetime")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary" />
                      Premium
                    </span>
                  </SelectItem>
                  <SelectItem value="lifetime">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Lifetime
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {planType === "premium" && (
              <div className="space-y-2">
                <Label>Dauer (Tage)</Label>
                <Input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  min="1"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Max. Nutzungen</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Ablaufdatum (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateCode} disabled={creating}>
              {creating ? "Erstelle..." : "Code erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}