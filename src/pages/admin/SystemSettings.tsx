import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useUserRole } from "@/hooks/useUserRole";
import { useSystemSettings, SystemSettings as SettingsType } from "@/hooks/useSystemSettings";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Shield, 
  Settings, 
  Palette, 
  Bell, 
  Brain, 
  Loader2, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Globe,
  Lock,
  Zap,
  Eye,
  Upload,
  CheckCircle2,
  Image,
  Type,
  Moon,
  Sun,
  Database,
  Server,
  Activity,
  Info
} from "lucide-react";
import { LogoUpload } from "@/components/admin/LogoUpload";
import { FaviconUpload } from "@/components/admin/FaviconUpload";
import { BrandingPreview } from "@/components/admin/BrandingPreview";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SystemSettings() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { settings, loading, saving, updateMultipleSettings, refetch } = useSystemSettings();
  
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showResetBrandingDialog, setShowResetBrandingDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");

  const defaultBrandingSettings = {
    app_name: "GLOWMAXXED AI",
    app_logo_url: "",
    favicon_url: "",
    accent_color: "#00FF88",
    default_theme: "dark" as const,
  };

  const isBrandingDefault = 
    localSettings.app_name === defaultBrandingSettings.app_name &&
    localSettings.app_logo_url === defaultBrandingSettings.app_logo_url &&
    localSettings.favicon_url === defaultBrandingSettings.favicon_url &&
    localSettings.accent_color === defaultBrandingSettings.accent_color &&
    localSettings.default_theme === defaultBrandingSettings.default_theme;

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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Einstellungen werden geladen...</p>
        </div>
      </div>
    );
  }
  
  if (!isOwner) return null;

  const SettingRow = ({ 
    label, 
    description, 
    children,
    icon: Icon
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />}
        <div className="min-w-0">
          <Label className="text-base font-medium">{label}</Label>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="sm:flex-shrink-0 pl-8 sm:pl-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Maintenance Mode Dialog */}
      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Wartungsmodus aktivieren?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Der Wartungsmodus sperrt die App für alle Nutzer. Nur Administratoren haben weiterhin Zugriff.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSave(false)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMaintenanceMode}
              className="bg-destructive hover:bg-destructive/90"
            >
              Aktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Branding Dialog */}
      <AlertDialog open={showResetBrandingDialog} onOpenChange={setShowResetBrandingDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              Branding zurücksetzen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Alle Branding-Einstellungen werden auf die Standardwerte zurückgesetzt.
                </p>
                <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">App-Name:</span>
                    <span className="text-primary font-medium">{defaultBrandingSettings.app_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Theme:</span>
                    <span className="text-primary font-medium">Dunkel</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Akzentfarbe:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: defaultBrandingSettings.accent_color }} />
                      <span className="text-primary font-medium">{defaultBrandingSettings.accent_color}</span>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-base sm:text-xl font-bold">Systemeinstellungen</span>
                {hasChanges && (
                  <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary hidden sm:inline-flex">
                    Ungespeichert
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!isMobile && (
              <Button variant="outline" size="sm" onClick={refetch} disabled={saving}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !hasChanges} size={isMobile ? "sm" : "default"} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {!isMobile && "Speichern"}
            </Button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="sticky top-14 sm:top-16 z-40 bg-primary/10 border-b border-primary/20">
          <div className="container px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Ungespeicherte Änderungen</span>
            </div>
            <Button size="sm" variant="default" onClick={handleSave} disabled={saving} className="h-7">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Jetzt speichern"}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container px-4 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className={`grid w-full ${isMobile ? "grid-cols-2 h-auto p-1" : "grid-cols-4"} gap-1`}>
            <TabsTrigger value="branding" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Branding</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Allgemein</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Brain className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>KI</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Erweitert</span>
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6 mt-0">
            {/* App Name Card */}
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Type className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">App-Name</CardTitle>
                      <CardDescription>Wird überall in der App angezeigt</CardDescription>
                    </div>
                  </div>
                  {localSettings.app_name !== settings.app_name && (
                    <Badge variant="outline" className="border-primary/50 text-primary">Geändert</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  value={localSettings.app_name} 
                  onChange={(e) => setLocalSettings((s) => ({ ...s, app_name: e.target.value }))}
                  placeholder="App-Name eingeben..."
                  className="text-lg font-medium h-12"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>Der App-Name wird im Browser-Tab, in der Navigation und auf der Landingpage angezeigt.</span>
                </div>
              </CardContent>
            </Card>

            {/* Logo & Favicon */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Logo</CardTitle>
                      <CardDescription>Haupt-Logo der App</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <LogoUpload
                    currentLogoUrl={localSettings.app_logo_url}
                    onLogoChange={(url) => setLocalSettings((s) => ({ ...s, app_logo_url: url }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Favicon</CardTitle>
                      <CardDescription>Browser-Tab Icon</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FaviconUpload
                    currentFaviconUrl={localSettings.favicon_url}
                    onFaviconChange={(url) => setLocalSettings((s) => ({ ...s, favicon_url: url }))}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Theme & Colors */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Design & Farben</CardTitle>
                    <CardDescription>Passe das Erscheinungsbild an</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Standard-Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setLocalSettings((s) => ({ ...s, default_theme: "dark" }))}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          localSettings.default_theme === "dark" 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="font-medium">Dunkel</span>
                      </button>
                      <button
                        onClick={() => setLocalSettings((s) => ({ ...s, default_theme: "light" }))}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          localSettings.default_theme === "light" 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="font-medium">Hell</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Akzentfarbe</Label>
                    <div className="flex gap-3">
                      <Input 
                        type="color" 
                        value={localSettings.accent_color} 
                        onChange={(e) => setLocalSettings((s) => ({ ...s, accent_color: e.target.value }))} 
                        className="w-16 h-12 p-1 cursor-pointer" 
                      />
                      <Input 
                        value={localSettings.accent_color} 
                        onChange={(e) => setLocalSettings((s) => ({ ...s, accent_color: e.target.value }))} 
                        className="flex-1 h-12 font-mono"
                        placeholder="#00FF88"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {["#00FF88", "#00D4FF", "#FF6B6B", "#FFD93D", "#C084FC", "#F472B6"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setLocalSettings((s) => ({ ...s, accent_color: color }))}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            localSettings.accent_color === color ? "border-foreground scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Vorschau</CardTitle>
                      <CardDescription>Live-Vorschau deiner Änderungen</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowResetBrandingDialog(true)}
                    disabled={isBrandingDefault}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {!isMobile && "Zurücksetzen"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BrandingPreview
                  appName={localSettings.app_name}
                  logoUrl={localSettings.app_logo_url}
                  faviconUrl={localSettings.favicon_url}
                  accentColor={localSettings.accent_color}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <Lock className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Wartungsmodus</CardTitle>
                    <CardDescription>App für Nutzer sperren</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl ${
                  localSettings.maintenance_mode ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {localSettings.maintenance_mode ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{localSettings.maintenance_mode ? "Wartungsmodus aktiv" : "App ist online"}</p>
                      <p className="text-sm text-muted-foreground">
                        {localSettings.maintenance_mode 
                          ? "Nur Admins haben Zugriff" 
                          : "Alle Nutzer können auf die App zugreifen"}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={localSettings.maintenance_mode} 
                    onCheckedChange={(c) => setLocalSettings((s) => ({ ...s, maintenance_mode: c }))} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Benutzer & Sicherheit</CardTitle>
                    <CardDescription>Registrierung und Auth-Einstellungen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <SettingRow 
                  label="E-Mail Auto-Confirm"
                  description="Neue Nutzer werden automatisch bestätigt"
                  icon={CheckCircle2}
                >
                  <Switch 
                    checked={localSettings.auto_confirm_email} 
                    onCheckedChange={(c) => setLocalSettings((s) => ({ ...s, auto_confirm_email: c }))} 
                  />
                </SettingRow>
                
                <SettingRow 
                  label="Analytics aktivieren"
                  description="Nutzungsdaten sammeln und auswerten"
                  icon={Activity}
                >
                  <Switch 
                    checked={localSettings.analytics_enabled} 
                    onCheckedChange={(c) => setLocalSettings((s) => ({ ...s, analytics_enabled: c }))} 
                  />
                </SettingRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Upload-Einstellungen</CardTitle>
                    <CardDescription>Datei-Upload Limits</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Max. Upload-Größe</Label>
                      <span className="text-sm font-mono text-primary">{localSettings.max_upload_size_mb} MB</span>
                    </div>
                    <Input 
                      type="range"
                      min={1} 
                      max={50} 
                      value={localSettings.max_upload_size_mb} 
                      onChange={(e) => setLocalSettings((s) => ({ ...s, max_upload_size_mb: parseInt(e.target.value) || 10 }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 MB</span>
                      <span>50 MB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="space-y-6 mt-0">
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">KI-Analyse Intensität</CardTitle>
                    <CardDescription>Wie detailliert soll die KI analysieren?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {[
                    { value: "light", label: "Leicht", description: "Schnelle Analyse, weniger Details", icon: Zap },
                    { value: "standard", label: "Standard", description: "Ausgewogene Analyse", icon: Activity },
                    { value: "deep", label: "Tiefgehend", description: "Maximale Details, längere Zeit", icon: Brain },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalSettings((s) => ({ ...s, ai_analysis_intensity: option.value as SettingsType["ai_analysis_intensity"] }))}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        localSettings.ai_analysis_intensity === option.value 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        localSettings.ai_analysis_intensity === option.value ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <option.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {localSettings.ai_analysis_intensity === option.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Hinweis zur Analyse-Intensität</p>
                    <p>Eine höhere Intensität liefert detailliertere Ergebnisse, benötigt jedoch mehr Rechenzeit und API-Credits.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">System-Status</CardTitle>
                    <CardDescription>Aktuelle Konfiguration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "App-Name", value: settings.app_name },
                    { label: "Theme", value: settings.default_theme === "dark" ? "Dunkel" : "Hell" },
                    { label: "Wartungsmodus", value: settings.maintenance_mode ? "Aktiv" : "Inaktiv" },
                    { label: "Auto-Confirm", value: settings.auto_confirm_email ? "Aktiviert" : "Deaktiviert" },
                    { label: "Analytics", value: settings.analytics_enabled ? "Aktiviert" : "Deaktiviert" },
                    { label: "Upload-Limit", value: `${settings.max_upload_size_mb} MB` },
                    { label: "KI-Intensität", value: settings.ai_analysis_intensity },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Aktionen</CardTitle>
                    <CardDescription>System-Verwaltung</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3" onClick={refetch} disabled={saving}>
                  <RefreshCw className="w-4 h-4" />
                  Einstellungen neu laden
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive" 
                  onClick={() => setShowResetBrandingDialog(true)}
                  disabled={isBrandingDefault}
                >
                  <RotateCcw className="w-4 h-4" />
                  Branding auf Standard zurücksetzen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
