import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  Copy, 
  Share2, 
  Users, 
  TrendingUp,
  Wallet,
  ArrowLeft,
  Check,
  Clock,
  Info,
  MessageCircle
} from "lucide-react";
import { useAffiliate } from "@/hooks/useAffiliate";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Affiliate() {
  const { 
    referralCode, 
    referralLink,
    stats, 
    earnings,
    payoutEmail,
    payoutMethod,
    copyReferralLink, 
    updatePayoutSettings,
    isLoading 
  } = useAffiliate();

  const [newPayoutEmail, setNewPayoutEmail] = useState(payoutEmail || "");
  const [newPayoutMethod, setNewPayoutMethod] = useState(payoutMethod || "paypal");
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePayoutSettings = async () => {
    setIsSaving(true);
    await updatePayoutSettings(newPayoutEmail, newPayoutMethod);
    setIsSaving(false);
  };

  const shareViaWhatsApp = () => {
    const text = `Hey! Ich nutze Glowmaxxed für meine Looksmaxxing-Journey und bin begeistert. Mit meinem Link bekommst du Zugang: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaTelegram = () => {
    const text = `Hey! Ich nutze Glowmaxxed für meine Looksmaxxing-Journey und bin begeistert. Mit meinem Link bekommst du Zugang: ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink || "")}&text=${encodeURIComponent(text)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Affiliate Programm</h1>
          <p className="text-muted-foreground">Verdiene 20% für jedes vermittelte Abo</p>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="p-6 mb-6 overflow-hidden relative glass-card">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">20% Provision</h2>
              <p className="text-muted-foreground">auf alle vermittelten Abos</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <motion.div 
              className="p-4 rounded-xl bg-background/50 border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Einladungen</span>
              </div>
              <div className="text-2xl font-bold">{stats.referralCount}</div>
            </motion.div>

            <motion.div 
              className="p-4 rounded-xl bg-background/50 border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Conversions</span>
              </div>
              <div className="text-2xl font-bold">{stats.conversionCount}</div>
            </motion.div>

            <motion.div 
              className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Ausstehend</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                €{stats.pendingEarnings.toFixed(2)}
              </div>
            </motion.div>

            <motion.div 
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <Wallet className="w-4 h-4" />
                <span className="text-xs">Gesamt</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                €{stats.totalEarnings.toFixed(2)}
              </div>
            </motion.div>
          </div>

          {/* Referral Link */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="text-xs text-muted-foreground mb-2">Dein Affiliate-Link</div>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 px-3 py-2 bg-background rounded-lg text-sm font-mono truncate">
                {referralLink}
              </code>
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyReferralLink}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Share Buttons */}
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={copyReferralLink}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Link kopieren
              </Button>
              <Button 
                variant="outline"
                onClick={shareViaWhatsApp}
                className="text-green-600"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* How it Works */}
      <Card className="p-6 mb-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          So funktioniert's
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">
              1
            </div>
            <div>
              <div className="font-medium">Teile deinen Link</div>
              <div className="text-sm text-muted-foreground">
                Sende deinen persönlichen Affiliate-Link an Freunde oder teile ihn in Social Media.
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">
              2
            </div>
            <div>
              <div className="font-medium">Dein Freund registriert sich</div>
              <div className="text-sm text-muted-foreground">
                Wenn jemand über deinen Link ein Abo abschließt, wirst du automatisch als Referrer vermerkt.
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 font-bold text-green-500">
              3
            </div>
            <div>
              <div className="font-medium">Du verdienst 20%</div>
              <div className="text-sm text-muted-foreground">
                Für jede Abo-Zahlung deines geworbenen Nutzers erhältst du 20% Provision.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Payout Settings */}
      <Card className="p-6 mb-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Auszahlungseinstellungen
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Auszahlungsmethode</Label>
            <Select value={newPayoutMethod} onValueChange={setNewPayoutMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Methode wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank">Banküberweisung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>{newPayoutMethod === "paypal" ? "PayPal E-Mail" : "E-Mail für Auszahlung"}</Label>
            <Input
              type="email"
              value={newPayoutEmail}
              onChange={(e) => setNewPayoutEmail(e.target.value)}
              placeholder="deine@email.de"
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleSavePayoutSettings}
            disabled={isSaving || !newPayoutEmail}
            className="w-full"
          >
            {isSaving ? "Speichern..." : "Einstellungen speichern"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Auszahlungen erfolgen ab einem Mindestbetrag von €50 und werden monatlich bearbeitet.
          </p>
        </div>
      </Card>

      {/* Earnings History */}
      <Card className="p-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Provisionshistorie
        </h3>
        
        {earnings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Noch keine Provisionen</p>
            <p className="text-sm">Teile deinen Link, um zu verdienen!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.map((earning) => (
              <div 
                key={earning.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div>
                  <div className="font-medium">
                    €{Number(earning.commission_amount).toFixed(2)} Provision
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(earning.created_at), "dd. MMMM yyyy", { locale: de })}
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                  earning.status === "paid" 
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                )}>
                  {earning.status === "paid" ? (
                    <>
                      <Check className="w-3 h-3" />
                      Ausgezahlt
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      Ausstehend
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
