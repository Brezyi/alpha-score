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
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

            <Button onClick={handleSaveProfile} className="w-full">
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
