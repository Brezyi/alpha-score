import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSensitiveData } from "@/hooks/useSensitiveData";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { SecuritySettingsDialog } from "@/components/SecuritySettingsDialog";
import { RedeemCodeDialog } from "@/components/RedeemCodeDialog";
import { RefundRequestDialog } from "@/components/RefundRequestDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Settings,
  LogOut,
  Palette,
  Upload,
  Check,
  Shield,
  Moon,
  Sun,
  HelpCircle,
  Trash2,
  CreditCard,
  Key,
  AlertTriangle,
  Sparkles,
  Gift,
  Lock,
  AlertCircle,
  Loader2,
  RotateCcw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { validateDisplayName } from "@/lib/displayNameValidation";

// Helper to check if subscription expires within days
const getExpirationWarning = (subscriptionEnd: string | null): { warning: boolean; daysLeft: number } => {
  if (!subscriptionEnd) return { warning: false, daysLeft: 0 };
  const endDate = new Date(subscriptionEnd);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { warning: daysLeft <= 7 && daysLeft > 0, daysLeft };
};

const ACCENT_COLORS = [
  { value: "#00FF88", label: "Neon Grün" },
  { value: "#00D4FF", label: "Cyan" },
  { value: "#FF6B6B", label: "Koralle" },
  { value: "#FFD93D", label: "Gold" },
  { value: "#C084FC", label: "Violett" },
  { value: "#F472B6", label: "Pink" },
];

const BACKGROUND_STYLES_DARK = [
  { value: "default", label: "Standard", color: "hsl(0 0% 4%)" },
  { value: "charcoal", label: "Kohle", color: "hsl(0 0% 8%)" },
  { value: "midnight", label: "Mitternacht", color: "hsl(220 20% 6%)" },
  { value: "forest", label: "Wald", color: "hsl(150 15% 5%)" },
];

const BACKGROUND_STYLES_LIGHT = [
  { value: "default", label: "Weiß", color: "hsl(0 0% 100%)" },
  { value: "charcoal", label: "Warm Grau", color: "hsl(0 0% 96%)" },
  { value: "midnight", label: "Blau-Grau", color: "hsl(220 20% 98%)" },
  { value: "forest", label: "Mint", color: "hsl(150 15% 97%)" },
];

export function ProfileMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile, uploadAvatar, displayNameChangeStatus } = useProfile();
  const { firstName, lastName, hasData: hasSensitiveData, updateSensitiveData, storeSensitiveData } = useSensitiveData();
  const { theme, accentColor, backgroundStyle, setTheme, setAccentColor, setBackgroundStyle } = useTheme();
  const { role } = useUserRole();
  const { isPremium, subscriptionType, subscriptionEnd, isAdminGranted, openCustomerPortal, createCheckout } = useSubscription();
  const { t, language } = useLanguage();
  const expirationInfo = getExpirationWarning(subscriptionEnd);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [redeemCodeOpen, setRedeemCodeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const debouncedDisplayName = useDebounce(displayName, 300);

  // Initialize fields when dialog opens
  useEffect(() => {
    if (profileOpen) {
      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }
      setEditFirstName(firstName || "");
      setEditLastName(lastName || "");
    }
  }, [profileOpen, profile?.display_name, firstName, lastName]);

  // Check display name availability
  useEffect(() => {
    const checkAvailability = async () => {
      const trimmedName = debouncedDisplayName.trim();
      
      if (!trimmedName || trimmedName.toLowerCase() === profile?.display_name?.toLowerCase()) {
        setNameAvailable(null);
        setIsCheckingName(false);
        return;
      }

      setIsCheckingName(true);
      try {
        const { data, error } = await supabase.rpc('check_display_name_available', {
          p_display_name: trimmedName,
          p_current_user_id: user?.id || null
        });

        if (error) throw error;
        setNameAvailable(data === true);
      } catch (error) {
        console.error('Error checking display name:', error);
        setNameAvailable(null);
      } finally {
        setIsCheckingName(false);
      }
    };

    checkAvailability();
  }, [debouncedDisplayName, profile?.display_name, user?.id]);

  const handleSaveProfile = async () => {
    const trimmedName = displayName.trim();
    const trimmedFirstName = editFirstName.trim();
    const trimmedLastName = editLastName.trim();
    
    // Validate display name for forbidden content
    if (trimmedName) {
      const nameValidation = validateDisplayName(trimmedName);
      if (!nameValidation.valid) {
        toast.error(nameValidation.error || t("register.invalidDisplayName"));
        return;
      }
    }
    
    if (trimmedName && trimmedName.toLowerCase() !== profile?.display_name?.toLowerCase() && nameAvailable === false) {
      toast.error(t("profile.nameTaken"));
      return;
    }
    
    setIsSavingProfile(true);
    try {
      // Update or store sensitive data if changed
      const firstNameChanged = trimmedFirstName !== (firstName || "");
      const lastNameChanged = trimmedLastName !== (lastName || "");
      
      if (firstNameChanged || lastNameChanged) {
        if (trimmedFirstName || trimmedLastName) {
          let sensitiveSuccess: boolean;
          if (hasSensitiveData) {
            sensitiveSuccess = await updateSensitiveData(trimmedFirstName, trimmedLastName);
          } else {
            sensitiveSuccess = await storeSensitiveData(trimmedFirstName, trimmedLastName);
          }
          if (!sensitiveSuccess) {
            toast.error(t("common.error"));
            return;
          }
          toast.success(t("common.success"));
        }
      }
      
      // Update display name if changed
      if (trimmedName && trimmedName !== profile?.display_name) {
        const success = await updateProfile({ display_name: trimmedName });
        if (!success) {
          return;
        }
      }
      
      setProfileOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await uploadAvatar(file);
    setIsUploading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const [isSendingDeleteEmail, setIsSendingDeleteEmail] = useState(false);

  const handleRequestDeletion = async () => {
    if (!user?.email) {
      toast.error(t("common.error"));
      return;
    }

    setIsSendingDeleteEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deletion", {
        body: { userId: user.id, email: user.email },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(t("forgot.sent"));
      setDeleteAccountOpen(false);
    } catch (error: any) {
      console.error("Deletion request error:", error);
      toast.error(t("common.error") + ": " + error.message);
    } finally {
      setIsSendingDeleteEmail(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error: any) {
      toast.error(t("common.error"));
    }
  };

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || "?";

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.display_name || t("profile.user")}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              {role && role !== "user" && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary capitalize">{role}</span>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>{t("profile.edit")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            <span>{t("profile.settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSecurityOpen(true)} className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            <span>{t("profile.security")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/support")} className="cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>{t("profile.support")}</span>
          </DropdownMenuItem>
          {(role === "admin" || role === "owner") && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("profile.admin")}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("profile.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.edit")}</DialogTitle>
            <DialogDescription>
              {t("profile.editDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary/30">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? t("profile.uploading") : t("profile.changeImage")}
              </Button>
            </div>

            {/* Private Name - Always Editable */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("profile.firstName")}</Label>
                <Input 
                  id="firstName"
                  value={editFirstName} 
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder={t("profile.firstNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("profile.lastName")}</Label>
                <Input 
                  id="lastName"
                  value={editLastName} 
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder={t("profile.lastNamePlaceholder")}
                />
              </div>
            </div>

            {/* Display Name (editable) */}
            <div className="space-y-2">
              <Label htmlFor="displayName">{t("profile.displayName")}</Label>
              {displayNameChangeStatus && !displayNameChangeStatus.allowed && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {t("profile.displayNameNextChange")} {displayNameChangeStatus.days_remaining} {displayNameChangeStatus.days_remaining === 1 ? t("profile.day") : t("profile.days")}
                  </span>
                </div>
              )}
              <div className="relative">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("profile.displayNamePlaceholder")}
                  disabled={displayNameChangeStatus && !displayNameChangeStatus.allowed}
                  className={cn(
                    displayNameChangeStatus && !displayNameChangeStatus.allowed && "opacity-70",
                    nameAvailable === false && "border-destructive focus-visible:ring-destructive",
                    nameAvailable === true && displayName.trim().toLowerCase() !== profile?.display_name?.toLowerCase() && "border-primary focus-visible:ring-primary"
                  )}
                />
                {isCheckingName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isCheckingName && nameAvailable === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                )}
                {!isCheckingName && nameAvailable === true && displayName.trim().toLowerCase() !== profile?.display_name?.toLowerCase() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
              {nameAvailable === false && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t("profile.nameTaken")}
                </p>
              )}
              {nameAvailable === true && displayName.trim().toLowerCase() !== profile?.display_name?.toLowerCase() && (
                <p className="text-sm text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {t("profile.nameAvailable")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("profile.displayNameHint")}
              </p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>{t("profile.email")}</Label>
              <Input value={user.email || ""} disabled className="opacity-70" />
            </div>

            {/* User ID (read-only) */}
            <div className="space-y-2">
              <Label>{t("profile.userId")}</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={user.id} 
                  disabled 
                  className="opacity-70 font-mono text-xs" 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={async () => {
                    await navigator.clipboard.writeText(user.id);
                    toast.success(t("profile.userIdCopied"));
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("profile.userIdHint")}
              </p>
            </div>

            {/* Subscription Status */}
            <div className="space-y-2">
              <Label>{t("profile.subStatus")}</Label>
              <div className={cn(
                "p-3 rounded-lg border",
                expirationInfo.warning 
                  ? "bg-destructive/10 border-destructive/30"
                  : isPremium 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-muted/50 border-border"
              )}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {subscriptionType === "owner" ? "Owner (Unlimited)" :
                     subscriptionType === "lifetime" ? "Lifetime" :
                     subscriptionType === "premium" ? "Premium" : "Free"}
                  </span>
                  {isPremium && !expirationInfo.warning && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {t("profile.active")}
                    </span>
                  )}
                  {expirationInfo.warning && (
                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t("profile.expiresSoon")}
                    </span>
                  )}
                </div>
                {expirationInfo.warning && subscriptionType === "premium" && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {t("profile.expiresIn")} {expirationInfo.daysLeft} {expirationInfo.daysLeft === 1 ? t("profile.day") : t("profile.days")} {t("profile.expiresInDays")}
                  </p>
                )}
                {subscriptionEnd && subscriptionType === "premium" && !expirationInfo.warning && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("profile.renewsAt")} {new Date(subscriptionEnd).toLocaleDateString(language === "en" ? "en-GB" : "de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                )}
                {subscriptionType === "lifetime" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("profile.unlimitedDuration")}
                  </p>
                )}
                {!isPremium && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("profile.upgradeHint")}
                  </p>
                )}
              </div>
            </div>

            {/* Upgrade Button for Free Users */}
            {!isPremium && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setProfileOpen(false);
                      createCheckout("premium");
                    }}
                    className="flex-1"
                    variant="default"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Premium (9,99€/Monat)
                  </Button>
                  <Button
                    onClick={() => {
                      setProfileOpen(false);
                      createCheckout("lifetime");
                    }}
                    className="flex-1"
                    variant="outline"
                  >
                    Lifetime (49,99€)
                  </Button>
                </div>
              </div>
            )}

            {/* Promocode Button - visible for all users */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProfileOpen(false);
                setRedeemCodeOpen(true);
              }}
              className="w-full text-muted-foreground"
            >
              <Gift className="w-4 h-4 mr-2" />
              {t("profile.redeemCode")}
            </Button>

            <Button 
              onClick={handleSaveProfile} 
              className="w-full"
              disabled={isSavingProfile || nameAvailable === false || isCheckingName}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>

            {/* Subscription Management - only show for real Stripe premium users */}
            {isPremium && subscriptionType === "premium" && !isAdminGranted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProfileOpen(false);
                  handleManageSubscription();
                }}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {t("profile.manageSub")}
              </Button>
            )}

            {/* Refund / Widerruf Button - for premium users with Stripe payments */}
            {isPremium && !isAdminGranted && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProfileOpen(false);
                    setRefundOpen(true);
                  }}
                  className="flex-1 text-muted-foreground"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("profile.refund")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/refund-status");
                  }}
                  className="flex-1 text-muted-foreground"
                >
                  {t("profile.viewRequests")}
                </Button>
              </div>
            )}

            {/* Admin-granted subscription hint */}
            {isPremium && isAdminGranted && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
                <Shield className="w-4 h-4" />
                <span>{t("profile.adminGranted")}</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProfileOpen(false);
                setDeleteAccountOpen(true);
              }}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("profile.deleteAccount")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.deleteAccountTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                {t("profile.deleteAccountDesc1")} <strong>{user?.email}</strong>.
              </span>
              <span className="block">
                {t("profile.deleteAccountDesc2")}
              </span>
              {isPremium && subscriptionType === "premium" && (
                <span className="block mt-2 text-destructive font-medium">
                  {t("profile.deleteAccountSubHint")}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingDeleteEmail}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestDeletion}
              disabled={isSendingDeleteEmail}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSendingDeleteEmail ? t("profile.sendingEmail") : t("profile.sendConfirmEmail")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Design Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.settings")}</DialogTitle>
            <DialogDescription>
              {t("profile.settingsDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Theme Toggle */}
            <div className="space-y-2">
              <Label>{t("profile.mode")}</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  {t("profile.dark")}
                </Button>
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  {t("profile.light")}
                </Button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label>{t("profile.accentColor")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setAccentColor(color.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                      accentColor === color.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    {accentColor === color.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div className="space-y-2">
              <Label>{t("profile.background")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(theme === "dark" ? BACKGROUND_STYLES_DARK : BACKGROUND_STYLES_LIGHT).map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => setBackgroundStyle(bg.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                      backgroundStyle === bg.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-md border border-border"
                      style={{ backgroundColor: bg.color }}
                    />
                    <span className="text-sm">{bg.label}</span>
                    {backgroundStyle === bg.value && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Settings Dialog */}
      <SecuritySettingsDialog open={securityOpen} onOpenChange={setSecurityOpen} />

      {/* Redeem Code Dialog */}
      <RedeemCodeDialog 
        open={redeemCodeOpen} 
        onOpenChange={setRedeemCodeOpen}
        onSuccess={() => window.location.reload()}
      />

      {/* Refund Request Dialog */}
      <RefundRequestDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
