import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings, Shield, Bell, Database, RefreshCw, Save } from "lucide-react";

export default function SystemSettings() {
  const navigate = useNavigate();
  const { isOwner } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    autoConfirmEmail: true,
    maxUploadSize: 10,
    streakReminderEnabled: true,
    analyticsEnabled: true,
  });

  useEffect(() => {
    if (!isOwner) {
      navigate("/admin");
      return;
    }
  }, [isOwner, navigate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Einstellungen gespeichert",
        description: "Die Systemeinstellungen wurden erfolgreich aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Systemeinstellungen</h1>
          </div>
          <Button onClick={handleSave} disabled={loading} size="sm">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Speichern
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Systemeinstellungen</h2>
            <p className="text-muted-foreground">
              Nur für Owner zugänglich
            </p>
          </div>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Allgemeine Einstellungen
            </CardTitle>
            <CardDescription>
              Grundlegende Systemkonfiguration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Wartungsmodus</Label>
                <p className="text-sm text-muted-foreground">
                  Deaktiviert den Zugriff für normale Nutzer
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, maintenanceMode: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-Mail Auto-Bestätigung</Label>
                <p className="text-sm text-muted-foreground">
                  Neue Nutzer werden automatisch bestätigt
                </p>
              </div>
              <Switch
                checked={settings.autoConfirmEmail}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, autoConfirmEmail: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Max. Upload-Größe (MB)</Label>
              <Input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, maxUploadSize: parseInt(e.target.value) || 10 }))
                }
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Maximale Dateigröße für Foto-Uploads
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Push-Benachrichtigungen und Erinnerungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Streak-Erinnerungen</Label>
                <p className="text-sm text-muted-foreground">
                  Tägliche Erinnerungen an inaktive Nutzer
                </p>
              </div>
              <Switch
                checked={settings.streakReminderEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, streakReminderEnabled: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics aktiviert</Label>
                <p className="text-sm text-muted-foreground">
                  Nutzungsstatistiken sammeln
                </p>
              </div>
              <Switch
                checked={settings.analyticsEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, analyticsEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
            <CardDescription>
              Irreversible Aktionen - mit Vorsicht verwenden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cache leeren</p>
                <p className="text-sm text-muted-foreground">
                  Löscht alle zwischengespeicherten Daten
                </p>
              </div>
              <Button variant="outline" size="sm">
                Cache leeren
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
