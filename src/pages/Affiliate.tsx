import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, Copy, Share2, Users, TrendingUp,
  Wallet, ArrowLeft, Check, Clock, MessageCircle,
  Banknote, AlertCircle, CheckCircle2
} from "lucide-react";
import { useAffiliate } from "@/hooks/useAffiliate";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de, enGB } from "date-fns/locale";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { validateIban, validateBic, formatIban } from "@/lib/ibanValidation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Affiliate() {
  const { t, language } = useLanguage();
  const dateLocale = language === "en" ? enGB : de;
  
  const { 
    referralCode, referralLink, stats, earnings,
    payoutEmail, payoutMethod, bankDetails, payoutRequests,
    copyReferralLink, updatePayoutSettings, requestPayout, isLoading 
  } = useAffiliate();

  const [newPayoutEmail, setNewPayoutEmail] = useState(payoutEmail || "");
  const [newPayoutMethod, setNewPayoutMethod] = useState(payoutMethod || "paypal");
  const [newIban, setNewIban] = useState(bankDetails.payout_iban || "");
  const [newBic, setNewBic] = useState(bankDetails.payout_bic || "");
  const [newAccountHolder, setNewAccountHolder] = useState(bankDetails.payout_account_holder || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [bicError, setBicError] = useState<string | null>(null);

  useEffect(() => {
    if (payoutEmail) setNewPayoutEmail(payoutEmail);
    if (payoutMethod) setNewPayoutMethod(payoutMethod);
    if (bankDetails.payout_iban) setNewIban(bankDetails.payout_iban);
    if (bankDetails.payout_bic) setNewBic(bankDetails.payout_bic);
    if (bankDetails.payout_account_holder) setNewAccountHolder(bankDetails.payout_account_holder);
  }, [payoutEmail, payoutMethod, bankDetails]);

  const handleIbanChange = (val: string) => {
    const formatted = formatIban(val);
    setNewIban(formatted);
    if (formatted.replace(/\s/g, "").length >= 5) {
      const result = validateIban(formatted);
      setIbanError(result.valid ? null : result.error || null);
    } else {
      setIbanError(null);
    }
  };

  const handleBicChange = (val: string) => {
    const upper = val.toUpperCase().replace(/\s/g, "");
    setNewBic(upper);
    if (upper.length >= 4) {
      const result = validateBic(upper);
      setBicError(result.valid ? null : result.error || null);
    } else {
      setBicError(null);
    }
  };

  const handleSavePayoutSettings = async () => {
    if (newPayoutMethod === "bank") {
      const ibanResult = validateIban(newIban);
      const bicResult = validateBic(newBic);
      if (!ibanResult.valid) { setIbanError(ibanResult.error || "Ungültig"); return; }
      if (!bicResult.valid) { setBicError(bicResult.error || "Ungültig"); return; }
    }
    setIsSaving(true);
    const bank = newPayoutMethod === "bank"
      ? { iban: newIban.replace(/\s/g, ""), bic: newBic, accountHolder: newAccountHolder }
      : undefined;
    await updatePayoutSettings(newPayoutEmail, newPayoutMethod, bank);
    setIsSaving(false);
  };

  const handleRequestPayout = async () => {
    setIsRequesting(true);
    await requestPayout();
    setIsRequesting(false);
  };

  const shareViaWhatsApp = () => {
    const text = `Hey! Ich nutze Glowmaxxed für meine Looksmaxxing-Journey und bin begeistert. Mit meinem Link bekommst du Zugang: ${referralLink}`;
    const encoded = encodeURIComponent(text);
    window.location.href = `whatsapp://send?text=${encoded}`;
  };

  const canRequestPayout = stats.pendingEarnings >= 50 && !payoutRequests.some(r => r.status === "pending");
  const hasPendingRequest = payoutRequests.some(r => r.status === "pending");

  const ibanValid = newIban.replace(/\s/g, "").length >= 15 && !ibanError;
  const bicValid = newBic.length >= 8 && !bicError;
  
  const isPayoutSettingsComplete = newPayoutMethod === "paypal"
    ? !!newPayoutEmail
    : !!(newAccountHolder && ibanValid && bicValid);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("affiliate.title")}</h1>
          <p className="text-muted-foreground">{t("affiliate.subtitle")}</p>
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
              <h2 className="text-xl font-bold">{t("affiliate.commission")}</h2>
              <p className="text-muted-foreground">{t("affiliate.onAllSubs")}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <motion.div className="p-4 rounded-xl bg-background/50 border border-border"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" /><span className="text-xs">{t("affiliate.invitations")}</span>
              </div>
              <div className="text-2xl font-bold">{stats.referralCount}</div>
            </motion.div>

            <motion.div className="p-4 rounded-xl bg-background/50 border border-border"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" /><span className="text-xs">{t("affiliate.conversions")}</span>
              </div>
              <div className="text-2xl font-bold">{stats.conversionCount}</div>
            </motion.div>

            <motion.div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                <Clock className="w-4 h-4" /><span className="text-xs">{t("affiliate.pending")}</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">€{stats.pendingEarnings.toFixed(2)}</div>
            </motion.div>

            <motion.div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <Wallet className="w-4 h-4" /><span className="text-xs">{t("affiliate.totalEarnings")}</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">€{stats.totalEarnings.toFixed(2)}</div>
            </motion.div>
          </div>

          {/* Referral Link */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="text-xs text-muted-foreground mb-2">{t("affiliate.yourLink")}</div>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 px-3 py-2 bg-background rounded-lg text-sm font-mono truncate">{referralLink}</code>
              <Button variant="outline" size="icon" onClick={copyReferralLink}><Copy className="w-4 h-4" /></Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600" onClick={copyReferralLink}>
                <Share2 className="w-4 h-4 mr-2" />{t("affiliate.copyLink")}
              </Button>
              <Button variant="outline" onClick={shareViaWhatsApp} className="text-green-600">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Payout Request */}
      <Card className="p-6 mb-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-primary" />
          {t("affiliate.requestPayout")}
        </h3>
        
        {hasPendingRequest ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t("affiliate.payoutProcessing")}</p>
              <p className="text-xs text-muted-foreground">
                {t("affiliate.payoutProcessingDesc")} €{payoutRequests.find(r => r.status === "pending")?.amount.toFixed(2)} {t("affiliate.payoutProcessingDesc2")}
              </p>
            </div>
          </div>
        ) : stats.pendingEarnings < 50 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">{t("affiliate.minNotReached")}</p>
              <p className="text-xs text-muted-foreground">
                {t("affiliate.minNotReachedDesc")} €{stats.pendingEarnings.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600" disabled={!isPayoutSettingsComplete}>
                <Wallet className="w-4 h-4 mr-2" />
                €{stats.pendingEarnings.toFixed(2)} {t("affiliate.requestPayout")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("affiliate.payoutConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("affiliate.payoutConfirmDesc")} <strong>€{stats.pendingEarnings.toFixed(2)}</strong> {t("affiliate.payoutConfirmDesc2")} {newPayoutMethod === "paypal" ? "PayPal" : t("affiliate.bankTransfer")}.
                  {t("affiliate.payoutConfirmDesc3")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestPayout} disabled={isRequesting}>
                  {isRequesting ? t("affiliate.requesting") : t("affiliate.requestNow")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {!isPayoutSettingsComplete && canRequestPayout && (
          <p className="text-xs text-destructive mt-2">{t("affiliate.savePayoutFirst")}</p>
        )}
      </Card>

      {/* How it Works */}
      <Card className="p-6 mb-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />{t("affiliate.howItWorks")}
        </h3>
        <div className="space-y-4">
          {[
            { step: "1", title: t("affiliate.step1Title"), desc: t("affiliate.step1Desc") },
            { step: "2", title: t("affiliate.step2Title"), desc: t("affiliate.step2Desc") },
            { step: "3", title: t("affiliate.step3Title"), desc: t("affiliate.step3Desc"), highlight: true },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold",
                item.highlight ? "bg-green-500/20 text-green-500" : "bg-primary/10 text-primary"
              )}>{item.step}</div>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payout Settings */}
      <Card className="p-6 mb-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />{t("affiliate.payoutSettings")}
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>{t("affiliate.payoutMethod")}</Label>
            <Select value={newPayoutMethod} onValueChange={setNewPayoutMethod}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t("affiliate.selectMethod")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank">{t("affiliate.bankTransfer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newPayoutMethod === "paypal" ? (
            <div>
              <Label>PayPal E-Mail</Label>
              <Input type="email" value={newPayoutEmail} onChange={(e) => setNewPayoutEmail(e.target.value)}
                placeholder="deine@email.de" className="mt-1" />
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div>
                <Label>{t("affiliate.accountHolder")}</Label>
                <Input value={newAccountHolder} onChange={(e) => setNewAccountHolder(e.target.value)}
                  placeholder="Max Mustermann" className="mt-1" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  IBAN
                  {ibanValid && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                </Label>
                <Input value={newIban} onChange={(e) => handleIbanChange(e.target.value)}
                  placeholder="DE89 3704 0044 0532 0130 00" className={cn("mt-1 font-mono", ibanError && "border-destructive")} />
                {ibanError && <p className="text-xs text-destructive mt-1">{ibanError}</p>}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  BIC / SWIFT
                  {bicValid && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                </Label>
                <Input value={newBic} onChange={(e) => handleBicChange(e.target.value)}
                  placeholder="COBADEFFXXX" className={cn("mt-1 font-mono", bicError && "border-destructive")} />
                {bicError && <p className="text-xs text-destructive mt-1">{bicError}</p>}
              </div>
            </div>
          )}

          <Button onClick={handleSavePayoutSettings} disabled={isSaving || !isPayoutSettingsComplete} className="w-full">
            {isSaving ? t("common.saving") : t("affiliate.saveSettings")}
          </Button>

          <p className="text-xs text-muted-foreground">
            {t("affiliate.payoutMinHint")}
          </p>
        </div>
      </Card>

      {/* Payout History */}
      {payoutRequests.length > 0 && (
        <Card className="p-6 mb-6 glass-card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />{t("affiliate.payoutRequests")}
          </h3>
          <div className="space-y-3">
            {payoutRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">€{Number(req.amount).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(req.created_at), "dd. MMM yyyy", { locale: dateLocale })} · {req.payout_method === "bank" ? "Bank" : "PayPal"}
                  </div>
                  {req.admin_notes && <div className="text-xs text-muted-foreground mt-1">{t("affiliate.note")} {req.admin_notes}</div>}
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                  req.status === "completed" ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : req.status === "rejected" ? "bg-destructive/10 text-destructive"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                )}>
                  {req.status === "completed" ? <><Check className="w-3 h-3" />{t("affiliate.paid")}</>
                    : req.status === "rejected" ? t("affiliate.rejected")
                    : <><Clock className="w-3 h-3" />{t("affiliate.processing")}</>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Earnings History */}
      <Card className="p-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />{t("affiliate.earningsHistory")}
        </h3>
        {earnings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t("affiliate.noEarnings")}</p>
            <p className="text-sm">{t("affiliate.noEarningsDesc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.map((earning) => (
              <div key={earning.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">€{Number(earning.commission_amount).toFixed(2)} {t("affiliate.commissionLabel")}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(earning.created_at), "dd. MMMM yyyy", { locale: dateLocale })}
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                  earning.status === "paid" ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                )}>
                  {earning.status === "paid" ? <><Check className="w-3 h-3" />{t("affiliate.paid")}</> : <><Clock className="w-3 h-3" />{t("affiliate.pending")}</>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
