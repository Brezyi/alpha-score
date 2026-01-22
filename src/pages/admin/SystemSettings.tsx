import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { useUserRole } from "@/hooks/useUserRole";
import { useSystemSettings, SystemSettings as SettingsType } from "@/hooks/useSystemSettings";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Settings, Palette, Bell, Brain, Loader2, Save, RefreshCw, AlertTriangle, RotateCcw } from "lucide-react";
import { LogoUpload } from "@/components/admin/LogoUpload";
import { FaviconUpload } from "@/components/admin/FaviconUpload";
import { BrandingPreview } from "@/components/admin/BrandingPreview";

export default function SystemSettings() {
  const navigate = useNavigate();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { settings, loading, saving, updateMultipleSettings, refetch } = useSystemSettings();
  
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showResetBrandingDialog, setShowResetBrandingDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  const defaultBrandingSettings = {
    app_name: "LooksMax",
    app_logo_url: "",
    favicon_url: "",
    accent_color: "#00FF88",
    default_theme: "dark" as const,
  };

  const resetBrandingSettings = () => {
    setLocalSettings((s) => ({
      ...s,
      ...defaultBrandingSettings,
    }));
    setShowResetBrandingDialog(false);
  };

  useEffect(() => {
    if (!roleLoading && !isOwner) navigate("/admin");
  }, [isOwner, roleLoading, navigate]);

  useEffect(() => { 
    setLocalSettings(settings); 
  }, [settings]);
  
  useEffect(() => { 
    setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings)); 
  }, [localSettings, settings]);

  const handleSave = async () => {
    const changes: Partial<SettingsType> = {};
    for (const key of Object.keys(localSettings) as (keyof SettingsType)[]) {
      if (localSettings[key] !== settings[key]) {
        (changes as Record<string, unknown>)[key] = localSettings[key];
      }
    }
    
    if (Object.keys(changes).length === 0) return;

    // Check for critical changes that need confirmation
    if (changes.maintenance_mode === true && !settings.maintenance_mode) {
      setShowMaintenanceDialog(true);
      setPendingSave(true);
      return;
    }

    await performSave(changes);
  };

  const performSave = async (changes: Partial<SettingsType>) => {
    await updateMultipleSettings(changes);
    setPendingSave(false);
  };

  const confirmMaintenanceMode = async () => {
    const changes: Partial<SettingsType> = {};
    for (const key of Object.keys(localSettings) as (keyof SettingsType)[]) {
      if (localSettings[key] !== settings[key]) {
        (changes as Record<string, unknown>)[key] = localSettings[key];
      }
    }
    setShowMaintenanceDialog(false);
    await performSave(changes);
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Maintenance Mode Confirmation Dialog */}
      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Wartungsmodus aktivieren?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Der Wartungsmodus sperrt die App für alle Nutzer. Nur Administratoren haben weiterhin Zugriff.
              Bist du sicher, dass du den Wartungsmodus aktivieren möchtest?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSave(false)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMaintenanceMode}
              className="bg-destructive hover:bg-destructive/90"
            >
              Wartungsmodus aktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Systemeinstellungen</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={refetch} disabled={saving}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Speichern
            </Button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl space-y-6">
        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Es gibt ungespeicherte Änderungen</span>
          </div>
        )}

        {/* Reset Branding Confirmation Dialog */}
        <AlertDialog open={showResetBrandingDialog} onOpenChange={setShowResetBrandingDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                Branding zurücksetzen?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Alle Branding-Einstellungen (App-Name, Logo, Favicon, Akzentfarbe, Theme) werden auf die Standardwerte zurückgesetzt. 
                Diese Änderung wird erst nach dem Speichern wirksam.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={resetBrandingSettings}>
                Zurücksetzen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle>Branding & Design</CardTitle>
            </div>
            <CardDescription>Passe das Erscheinungsbild an</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>App-Name</Label>
              <Input 
                value={localSettings.app_name} 
                onChange={(e) => setLocalSettings((s) => ({ ...s, app_name: e.target.value }))} 
              />
            </div>
            <Separator />
            <LogoUpload
              currentLogoUrl={localSettings.app_logo_url}
              onLogoChange={(url) => setLocalSettings((s) => ({ ...s, app_logo_url: url }))}
            />
            <Separator />
            <FaviconUpload
              currentFaviconUrl={localSettings.favicon_url}
              onFaviconChange={(url) => setLocalSettings((s) => ({ ...s, favicon_url: url }))}
            />
            <Separator />
            <BrandingPreview
              appName={localSettings.app_name}
              logoUrl={localSettings.app_logo_url}
              faviconUrl={localSettings.favicon_url}
              accentColor={localSettings.accent_color}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Standard-Theme</Label>
                <Select 
                  value={localSettings.default_theme} 
                  onValueChange={(v: "dark"|"light") => setLocalSettings((s) => ({ ...s, default_theme: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dunkel</SelectItem>
                    <SelectItem value="light">Hell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Akzentfarbe</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={localSettings.accent_color} 
                    onChange={(e) => setLocalSettings((s) => ({ ...s, accent_color: e.target.value }))} 
                    className="w-14 h-10 p-1" 
                  />
                  <Input 
                    value={localSettings.accent_color} 
                    onChange={(e) => setLocalSettings((s) => ({ ...s, accent_color: e.target.value }))} 
                    className="flex-1" 
                  />
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowResetBrandingDialog(true)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Branding zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Allgemeine Einstellungen</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Wartungsmodus</Label>
                <p className="text-sm text-muted-foreground">Sperrt die App für Nutzer</p>
              </div>
              <Switch 
                checked={localSettings.maintenance_mode} 
                onCheckedChange={(c) => setLocalSettings((s) => ({ ...s, maintenance_mode: c }))} 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">E-Mail Auto-Confirm</Label>
                <p className="text-sm text-muted-foreground">Automatische Bestätigung</p>
              </div>
              <Switch 
                checked={localSettings.auto_confirm_email} 
                onCheckedChange={(c) => setLocalSettings((s) => ({ ...s, auto_confirm_email: c }))} 
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Max. Upload-Größe (MB)</Label>
              <Input 
                type="number" 
                min={1} 
                max={50} 
                value={localSettings.max_upload_size_mb} 
                onChange={(e) => setLocalSettings((s) => ({ ...s, max_upload_size_mb: parseInt(e.target.value) || 10 }))} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle>KI-Parameter</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Analyse-Intensität</Label>
              <Select 
                value={localSettings.ai_analysis_intensity} 
                onValueChange={(v: "light"|"standard"|"deep") => setLocalSettings((s) => ({ ...s, ai_analysis_intensity: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Leicht</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Tiefgehend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Benachrichtigungen</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Analytics aktivieren</Label>
              </div>
              <Switch 
                checked={localSettings.analytics_enabled} 
                onCheckedChange={(c) => setLocalSettings((s) => ({ ...s, analytics_enabled: c }))} 
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
