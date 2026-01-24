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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Plus, Trash2, Copy, ChevronDown, Percent, Euro, Ticket, BarChart3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

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
      return `${(coupon.amount_off / 100).toFixed(2)} ${coupon.currency.toUpperCase()}`;
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Zugriff verweigert</CardTitle>
            <CardDescription>Du hast keine Berechtigung für diese Seite.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Stripe Rabattcodes</h1>
              <p className="text-muted-foreground">Verwalte Coupons und Aktionscodes</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Rabattcode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Rabattcode erstellen</DialogTitle>
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
                    onChange={(e) => setFormName(e.target.value)}
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
                        <SelectItem value="percent">Prozent (%)</SelectItem>
                        <SelectItem value="amount">Betrag (€)</SelectItem>
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
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
                      <SelectItem value="once">Einmalig</SelectItem>
                      <SelectItem value="repeating">Wiederkehrend (X Monate)</SelectItem>
                      <SelectItem value="forever">Unbegrenzt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formDuration === "repeating" && (
                  <div className="space-y-2">
                    <Label htmlFor="months">Anzahl Monate</Label>
                    <Input
                      id="months"
                      type="number"
                      placeholder="3"
                      value={formDurationMonths}
                      onChange={(e) => setFormDurationMonths(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxRedemptions">Max. Einlösungen</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      placeholder="Unbegrenzt"
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateCoupon} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Codes</p>
                  <p className="text-2xl font-bold">{activeCoupons}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt-Einlösungen</p>
                  <p className="text-2xl font-bold">{totalRedemptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Percent className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codes gesamt</p>
                  <p className="text-2xl font-bold">{coupons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Rabattcodes</CardTitle>
            <CardDescription>Übersicht aller Stripe Coupons und Promocodes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Rabattcodes vorhanden.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rabatt</TableHead>
                    <TableHead>Dauer</TableHead>
                    <TableHead>Einlösungen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <Collapsible key={coupon.id} asChild>
                      <>
                        <TableRow className="group">
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setExpandedCoupon(expandedCoupon === coupon.id ? null : coupon.id)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedCoupon === coupon.id ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {coupon.percent_off ? (
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Euro className="h-4 w-4 text-muted-foreground" />
                              )}
                              {coupon.name || coupon.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{formatDiscount(coupon)}</Badge>
                          </TableCell>
                          <TableCell>{formatDuration(coupon)}</TableCell>
                          <TableCell>
                            {coupon.times_redeemed}
                            {coupon.max_redemptions && ` / ${coupon.max_redemptions}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.valid ? "default" : "secondary"}>
                              {coupon.valid ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(coupon.id)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {coupon.valid && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeactivateCoupon(coupon.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={7} className="p-4">
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Promocodes:</p>
                                {coupon.promotion_codes.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Keine Promocodes</p>
                                ) : (
                                  <div className="grid gap-2">
                                    {coupon.promotion_codes.map((pc) => (
                                      <div
                                        key={pc.id}
                                        className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                      >
                                        <div className="flex items-center gap-3">
                                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
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
                                )}
                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                  <span>Coupon ID: {coupon.id}</span>
                                  <span className="mx-2">•</span>
                                  <span>
                                    Erstellt:{" "}
                                    {new Date(coupon.created * 1000).toLocaleDateString("de-DE")}
                                  </span>
                                  {coupon.redeem_by && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>
                                        Gültig bis:{" "}
                                        {new Date(coupon.redeem_by * 1000).toLocaleDateString("de-DE")}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
