import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Camera, 
  Target, 
  TrendingUp, 
  Heart, 
  Users, 
  MessageSquare,
  Sparkles,
  Trophy,
  Flame,
  Droplets,
  Moon,
  Utensils,
  Timer,
  Dumbbell,
  Ruler,
  ShoppingCart,
  BookOpen,
  ImageIcon,
  DollarSign,
  HelpCircle,
  ArrowLeft,
  Crown,
  Lock,
  ChevronRight,
  Compass,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { ScannerLogo } from "@/components/ScannerLogo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "@/components/mobile/MobileAppLayout";

interface Feature {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  premium: boolean;
  category: string;
  isNew?: boolean;
}

const features: Feature[] = [
  // Core Features
  {
    id: "analysis",
    icon: Camera,
    title: "KI-Analyse",
    description: "Lade Fotos hoch und erhalte einen detaillierten Score deiner Gesichtszüge",
    href: "/upload",
    premium: false,
    category: "core",
  },
  {
    id: "plan",
    icon: Target,
    title: "Personalisierter Plan",
    description: "Maßgeschneiderte Empfehlungen basierend auf deiner Analyse",
    href: "/plan",
    premium: true,
    category: "core",
  },
  {
    id: "progress",
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung mit Charts und Timeline",
    href: "/progress",
    premium: true,
    category: "core",
  },
  {
    id: "coach",
    icon: MessageSquare,
    title: "KI-Coach",
    description: "Chatte mit deinem persönlichen Looksmax-Berater",
    href: "/coach",
    premium: true,
    category: "core",
  },
  
  // Lifestyle Features
  {
    id: "nutrition",
    icon: Utensils,
    title: "Ernährungs-Tracker",
    description: "Tracke Kalorien und Makros mit KI-Food-Scanner",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "water",
    icon: Droplets,
    title: "Wasser-Tracker",
    description: "Erreiche dein tägliches Trinkziel mit Erinnerungen",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "sleep",
    icon: Moon,
    title: "Schlaf-Tracker",
    description: "Optimiere deinen Schlaf für bessere Ergebnisse",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "fasting",
    icon: Timer,
    title: "Intervallfasten",
    description: "16:8 bis 20:4 Timer für intermittierendes Fasten",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "activity",
    icon: Dumbbell,
    title: "Aktivitäts-Tracker",
    description: "Tracke Workouts, Schritte und verbrannte Kalorien",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "body",
    icon: Ruler,
    title: "Körpermaße",
    description: "Verfolge Gewicht, Brust, Taille und mehr",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "recipes",
    icon: BookOpen,
    title: "Rezept-Datenbank",
    description: "Gesunde Rezepte mit Makro-Informationen",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "grocery",
    icon: ShoppingCart,
    title: "Einkaufsliste",
    description: "Automatische Listen basierend auf Rezepten",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  {
    id: "progress-photos",
    icon: ImageIcon,
    title: "Fortschritts-Fotos",
    description: "Dokumentiere deine Transformation visuell",
    href: "/lifestyle",
    premium: true,
    category: "lifestyle",
  },
  
  // Social & Gamification
  {
    id: "friends",
    icon: Users,
    title: "Freunde",
    description: "Verbinde dich mit anderen und vergleiche Fortschritte",
    href: "/friends",
    premium: false,
    category: "social",
  },
  {
    id: "challenges",
    icon: Zap,
    title: "Tägliche Challenges",
    description: "Sammle XP durch tägliche Aufgaben",
    href: "/dashboard",
    premium: false,
    category: "social",
  },
  {
    id: "achievements",
    icon: Trophy,
    title: "Achievements",
    description: "Schalte 50+ Erfolge für Meilensteine frei",
    href: "/progress",
    premium: false,
    category: "social",
  },
  {
    id: "streak",
    icon: Flame,
    title: "Streak-System",
    description: "Halte deine Aktivitäts-Serie am Laufen",
    href: "/dashboard",
    premium: false,
    category: "social",
  },
  
  // Other
  {
    id: "affiliate",
    icon: DollarSign,
    title: "Affiliate-Programm",
    description: "Verdiene 20% Provision pro geworbenem Abo",
    href: "/affiliate",
    premium: false,
    category: "other",
  },
  {
    id: "support",
    icon: HelpCircle,
    title: "Support",
    description: "Hilfe und FAQ zu allen Funktionen",
    href: "/support",
    premium: false,
    category: "other",
  },
];

const categories = [
  { id: "all", label: "Alle", icon: Compass },
  { id: "core", label: "Kern-Features", icon: Sparkles },
  { id: "lifestyle", label: "Lifestyle", icon: Heart },
  { id: "social", label: "Social & XP", icon: Trophy },
  { id: "other", label: "Sonstiges", icon: HelpCircle },
];

export default function Discover() {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [activeCategory, setActiveCategory] = useState("all");
  const isNative = Capacitor.isNativePlatform();

  const filteredFeatures = activeCategory === "all" 
    ? features 
    : features.filter(f => f.category === activeCategory);

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Alle Features entdecken</h1>
        <p className="text-muted-foreground text-sm">
          Finde alle Funktionen der App auf einen Blick
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 gap-1.5",
                activeCategory === cat.id && "shadow-md"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Premium freischalten</p>
                <p className="text-xs text-muted-foreground">
                  Zugriff auf alle {features.filter(f => f.premium).length} Premium-Features
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/pricing")}>
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredFeatures.map((feature, index) => {
          const Icon = feature.icon;
          const isLocked = feature.premium && !isPremium;
          
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link to={isLocked ? "/pricing" : feature.href}>
                <Card className={cn(
                  "group hover:shadow-lg transition-all duration-300 cursor-pointer h-full",
                  isLocked && "opacity-70"
                )}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      isLocked ? "bg-muted" : "bg-primary/10"
                    )}>
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Icon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {feature.title}
                        </h3>
                        {feature.premium && !isPremium && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Premium
                          </Badge>
                        )}
                        {feature.isNew && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary">
                            Neu
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {features.length} Features verfügbar • {features.filter(f => !f.premium).length} kostenlos
        </p>
      </div>
    </div>
  );

  if (isNative) {
    return (
      <MobileAppLayout showBack title="Entdecken">
        <div className="p-4 pb-24">
          {content}
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <ScannerLogo size="sm" labelSize="lg" />
            </div>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl mx-auto">
        {content}
      </main>
    </div>
  );
}
