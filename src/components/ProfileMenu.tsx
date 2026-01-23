import { useState, useRef } from "react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { SecuritySettingsDialog } from "@/components/SecuritySettingsDialog";
import { RedeemCodeDialog } from "@/components/RedeemCodeDialog";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { theme, accentColor, backgroundStyle, setTheme, setAccentColor, setBackgroundStyle } = useTheme();
  const { role } = useUserRole();
  const { isPremium, subscriptionType, subscriptionEnd, isAdminGranted, openCustomerPortal, createCheckout } = useSubscription();
  const expirationInfo = getExpirationWarning(subscriptionEnd);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [redeemCodeOpen, setRedeemCodeOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileOpen = () => {
    setDisplayName(profile?.display_name || "");
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (displayName.trim()) {
      await updateProfile({ display_name: displayName.trim() });
    }
    setProfileOpen(false);
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
      toast.error("Keine E-Mail-Adresse gefunden");
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

      toast.success("Bestätigungs-E-Mail gesendet! Überprüfe dein Postfach.");
      setDeleteAccountOpen(false);
    } catch (error: any) {
      console.error("Deletion request error:", error);
      toast.error("Fehler beim Senden der E-Mail: " + error.message);
    } finally {
      setIsSendingDeleteEmail(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error: any) {
      toast.error("Fehler beim Öffnen des Kundenportals");
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
                {profile?.display_name || "Benutzer"}
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
          <DropdownMenuItem onClick={handleProfileOpen} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profil bearbeiten</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            <span>Design anpassen</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSecurityOpen(true)} className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            <span>Sicherheit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/support")} className="cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
          {(role === "admin" || role === "owner") && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Ausloggen</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profil bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisiere deinen Namen und dein Profilbild
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
                {isUploading ? "Wird hochgeladen..." : "Bild ändern"}
              </Button>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Anzeigename</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={user.email || ""} disabled className="opacity-70" />
            </div>

            {/* User ID (read-only) */}
            <div className="space-y-2">
              <Label>Deine User-ID</Label>
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
                    toast.success("User-ID kopiert!");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Für Support-Anfragen oder zur Identifikation
              </p>
            </div>

            {/* Subscription Status */}
            <div className="space-y-2">
              <Label>Abo-Status</Label>
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
                      Aktiv
                    </span>
                  )}
                  {expirationInfo.warning && (
                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Läuft bald ab
                    </span>
                  )}
                </div>
                {expirationInfo.warning && subscriptionType === "premium" && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Dein Abo läuft in {expirationInfo.daysLeft} {expirationInfo.daysLeft === 1 ? "Tag" : "Tagen"} ab!
                  </p>
                )}
                {subscriptionEnd && subscriptionType === "premium" && !expirationInfo.warning && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Verlängert am: {new Date(subscriptionEnd).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                )}
                {subscriptionType === "lifetime" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Unbegrenzte Laufzeit
                  </p>
                )}
                {!isPremium && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade für alle Premium-Features
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
                    Lifetime (50€)
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
              Promocode einlösen
            </Button>

            <Button onClick={handleSaveProfile} className="w-full">
              Speichern
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
                Abo verwalten
              </Button>
            )}

            {/* Admin-granted subscription hint */}
            {isPremium && isAdminGranted && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
                <Shield className="w-4 h-4" />
                <span>Von Admin vergeben</span>
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
              Konto löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto löschen anfordern</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Wir senden dir eine Bestätigungs-E-Mail an <strong>{user?.email}</strong>.
              </span>
              <span className="block">
                Klicke auf den Link in der E-Mail und gib dein Passwort ein, um die Löschung endgültig zu bestätigen.
              </span>
              {isPremium && subscriptionType === "premium" && (
                <span className="block mt-2 text-destructive font-medium">
                  Hinweis: Dein aktives Abo wird separat über Stripe gekündigt.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingDeleteEmail}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestDeletion}
              disabled={isSendingDeleteEmail}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSendingDeleteEmail ? "Wird gesendet..." : "Bestätigungs-E-Mail senden"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Design Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Design anpassen</DialogTitle>
            <DialogDescription>
              Personalisiere das Aussehen der App
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Theme Toggle */}
            <div className="space-y-2">
              <Label>Modus</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dunkel
                </Button>
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Hell
                </Button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label>Akzentfarbe</Label>
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
              <Label>Hintergrund</Label>
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
    </>
  );
}
