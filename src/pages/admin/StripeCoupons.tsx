import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronDown, 
  Percent, 
  Euro, 
  Ticket, 
  BarChart3, 
  Loader2,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface PromotionCode {
  id: string;
  code: string;
  active: boolean;
  times_redeemed: number;
  max_redemptions: number | null;
}

interface StripeCoupon {
  id: string;
  name: string | null;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: string;
  duration_in_months: number | null;
  max_redemptions: number | null;
  times_redeemed: number;
  valid: boolean;
  created: number;
  redeem_by: number | null;
  promotion_codes: PromotionCode[];
}

export default function StripeCoupons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isOwner } = useUserRole();
  
  const [coupons, setCoupons] = useState<StripeCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"percent" | "amount">("percent");
  const [formValue, setFormValue] = useState("");
  const [formDuration, setFormDuration] = useState("once");
  const [formDurationMonths, setFormDurationMonths] = useState("");
  const [formMaxRedemptions, setFormMaxRedemptions] = useState("");
  const [formRedeemBy, setFormRedeemBy] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-stripe-coupons", {
        body: { action: "list" },
      });

      if (error) throw error;
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Fehler",
        description: "Rabattcodes konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    if (!formName || !formValue) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const params: Record<string, unknown> = {
        action: "create",
        name: formName,
        duration: formDuration,
      };

      if (formType === "percent") {
        params.percent_off = parseFloat(formValue);
      } else {
        params.amount_off = Math.round(parseFloat(formValue) * 100);
        params.currency = "eur";
      }

      if (formDuration === "repeating" && formDurationMonths) {
        params.duration_in_months = parseInt(formDurationMonths);
      }

      if (formMaxRedemptions) {
        params.max_redemptions = parseInt(formMaxRedemptions);
      }

      if (formRedeemBy) {
        params.redeem_by = formRedeemBy;
      }

      const { data, error } = await supabase.functions.invoke("manage-stripe-coupons", {
        body: params,
      });

      if (error) throw error;

      toast({
        title: "Rabattcode erstellt",
        description: `Code "${data.coupon.promotion_code}" wurde erfolgreich erstellt.`,
      });

      // Reset form
      setFormName("");
      setFormValue("");
      setFormDuration("once");
      setFormDurationMonths("");
      setFormMaxRedemptions("");
      setFormRedeemBy("");
      setDialogOpen(false);
      
      fetchCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Fehler",
        description: "Rabattcode konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-stripe-coupons", {
        body: { action: "deactivate", coupon_id: couponId },
      });

      if (error) throw error;

      toast({
        title: "Rabattcode deaktiviert",
        description: "Der Rabattcode wurde erfolgreich gelöscht.",
      });

      fetchCoupons();
    } catch (error) {
      console.error("Error deactivating coupon:", error);
      toast({
        title: "Fehler",
        description: "Rabattcode konnte nicht deaktiviert werden.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePromoCode = async (promoCodeId: string, active: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("manage-stripe-coupons", {
        body: { action: "toggle_promo_code", promo_code_id: promoCodeId, active },
      });

      if (error) throw error;

      toast({
        title: active ? "Promocode aktiviert" : "Promocode deaktiviert",
      });

      fetchCoupons();
    } catch (error) {
      console.error("Error toggling promo code:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert!", description: text });
  };

  const formatDiscount = (coupon: StripeCoupon) => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}%`;
    }
    if (coupon.amount_off && coupon.currency) {
      return `${(coupon.amount_off / 100).toFixed(2)}€`;
    }
    return "-";
  };

  const formatDuration = (coupon: StripeCoupon) => {
    switch (coupon.duration) {
      case "once":
        return "Einmalig";
      case "forever":
        return "Unbegrenzt";
      case "repeating":
        return `${coupon.duration_in_months} Monate`;
      default:
        return coupon.duration;
    }
  };

  const totalRedemptions = coupons.reduce((sum, c) => sum + c.times_redeemed, 0);
  const activeCoupons = coupons.filter((c) => c.valid).length;

  if (!isOwner && role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zugriff verweigert</CardTitle>
            <CardDescription>Du hast keine Berechtigung für diese Seite.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/admin")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Stripe Rabattcodes</h1>
              </div>
              <p className="text-sm text-muted-foreground">Verwalte Coupons und Aktionscodes</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                Neuer Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Neuen Rabattcode erstellen
                </DialogTitle>
                <DialogDescription>
                  Erstelle einen neuen Stripe Coupon mit Promocode.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name / Code</Label>
                  <Input
                    id="name"
                    placeholder="z.B. SOMMER2025"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rabatt-Typ</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as "percent" | "amount")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">
                          <span className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Prozent
                          </span>
                        </SelectItem>
                        <SelectItem value="amount">
                          <span className="flex items-center gap-2">
                            <Euro className="h-4 w-4" />
                            Betrag
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Wert</Label>
                    <div className="relative">
                      <Input
                        id="value"
                        type="number"
                        placeholder={formType === "percent" ? "20" : "10.00"}
                        value={formValue}
                        onChange={(e) => setFormValue(e.target.value)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        {formType === "percent" ? "%" : "€"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gültigkeitsdauer</Label>
                  <Select value={formDuration} onValueChange={setFormDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Einmalig
                        </span>
                      </SelectItem>
                      <SelectItem value="repeating">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Wiederkehrend
                        </span>
                      </SelectItem>
                      <SelectItem value="forever">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Unbegrenzt
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formDuration === "repeating" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label htmlFor="months">Anzahl Monate</Label>
                    <Input
                      id="months"
                      type="number"
                      placeholder="3"
                      value={formDurationMonths}
                      onChange={(e) => setFormDurationMonths(e.target.value)}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxRedemptions">Max. Einlösungen</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      placeholder="∞"
                      value={formMaxRedemptions}
                      onChange={(e) => setFormMaxRedemptions(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redeemBy">Gültig bis</Label>
                    <Input
                      id="redeemBy"
                      type="date"
                      value={formRedeemBy}
                      onChange={(e) => setFormRedeemBy(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateCoupon} disabled={creating} className="gap-2">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aktive Codes</p>
                    <p className="text-3xl font-bold text-primary">{activeCoupons}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border overflow-hidden relative">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Einlösungen gesamt</p>
                    <p className="text-3xl font-bold">{totalRedemptions}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border overflow-hidden relative">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Codes gesamt</p>
                    <p className="text-3xl font-bold">{coupons.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary">
                    <Percent className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Coupons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Alle Rabattcodes
              </CardTitle>
              <CardDescription>Übersicht aller Stripe Coupons und Promocodes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Lade Rabattcodes...</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Ticket className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Noch keine Rabattcodes</p>
                    <p className="text-sm text-muted-foreground">Erstelle deinen ersten Coupon!</p>
                  </div>
                  <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Code erstellen
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <AnimatePresence>
                    {coupons.map((coupon, index) => (
                      <motion.div
                        key={coupon.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        {/* Coupon Row */}
                        <div 
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setExpandedCoupon(expandedCoupon === coupon.id ? null : coupon.id)}
                        >
                          {/* Icon */}
                          <div className={`p-2.5 rounded-xl transition-colors ${
                            coupon.valid 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {coupon.percent_off ? (
                              <Percent className="h-5 w-5" />
                            ) : (
                              <Euro className="h-5 w-5" />
                            )}
                          </div>

                          {/* Name & Discount */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">
                                {coupon.name || coupon.id}
                              </p>
                              <Badge 
                                variant={coupon.valid ? "default" : "secondary"}
                                className={coupon.valid ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}
                              >
                                {formatDiscount(coupon)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDuration(coupon)}
                              </span>
                              <span>•</span>
                              <span>{coupon.times_redeemed} Einlösungen</span>
                              {coupon.max_redemptions && (
                                <span className="text-muted-foreground/70">
                                  / {coupon.max_redemptions}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            {coupon.valid ? (
                              <Badge variant="outline" className="border-primary/50 text-primary gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Aktiv
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground gap-1">
                                <XCircle className="h-3 w-3" />
                                Inaktiv
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(coupon.promotion_codes[0]?.code || coupon.id);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {coupon.valid && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeactivateCoupon(coupon.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <ChevronDown 
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                expandedCoupon === coupon.id ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedCoupon === coupon.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-0 ml-[60px] space-y-4">
                                {/* Promo Codes */}
                                {coupon.promotion_codes.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Promocodes</p>
                                    <div className="grid gap-2">
                                      {coupon.promotion_codes.map((pc) => (
                                        <div
                                          key={pc.id}
                                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                                        >
                                          <div className="flex items-center gap-3">
                                            <code className="text-sm font-mono font-semibold px-2 py-1 bg-background rounded border">
                                              {pc.code}
                                            </code>
                                            <span className="text-sm text-muted-foreground">
                                              {pc.times_redeemed} Einlösungen
                                              {pc.max_redemptions && ` / ${pc.max_redemptions}`}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => copyToClipboard(pc.code)}
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                              checked={pc.active}
                                              onCheckedChange={(checked) =>
                                                handleTogglePromoCode(pc.id, checked)
                                              }
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Meta Info */}
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">ID:</span>
                                    <code className="font-mono">{coupon.id}</code>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Erstellt: {new Date(coupon.created * 1000).toLocaleDateString("de-DE")}
                                  </span>
                                  {coupon.redeem_by && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Gültig bis: {new Date(coupon.redeem_by * 1000).toLocaleDateString("de-DE")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
