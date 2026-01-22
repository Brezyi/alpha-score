import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Camera, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  Crown,
  LogOut,
  User,
  Flame,
  ChevronRight,
  Lock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const quickActions = [
  {
    icon: Camera,
    title: "Neue Analyse",
    description: "Lade Fotos hoch für deine KI-Bewertung",
    href: "/analyse",
    color: "bg-primary/10 text-primary",
    premium: false,
  },
  {
    icon: Target,
    title: "Mein Plan",
    description: "Dein personalisierter Looksmax-Plan",
    href: "/plan",
    color: "bg-blue-500/10 text-blue-400",
    premium: true,
  },
  {
    icon: TrendingUp,
    title: "Fortschritt",
    description: "Verfolge deine Entwicklung",
    href: "/progress",
    color: "bg-orange-500/10 text-orange-400",
    premium: true,
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description: "Stelle Fragen an deinen Coach",
    href: "/coach",
    color: "bg-purple-500/10 text-purple-400",
    premium: true,
  },
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Abgemeldet",
      description: "Bis bald!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = false; // TODO: Check actual premium status

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">FaceRank</span>
            </Link>

            <div className="flex items-center gap-4">
              {!isPremium && (
                <Link to="/pricing">
                  <Button variant="premium" size="sm" className="hidden sm:flex">
                    <Crown className="w-4 h-4" />
                    Premium
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hey, {user?.user_metadata?.full_name?.split(" ")[0] || "Champ"} 👋
          </h1>
          <p className="text-muted-foreground">
            Bereit, heute besser zu werden?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Aktueller Score</div>
            <div className="text-3xl font-bold text-gradient">—</div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Ziel Score</div>
            <div className="text-3xl font-bold">8.5</div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Streak</div>
            <div className="text-3xl font-bold flex items-center gap-2">
              0 <Flame className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm text-muted-foreground mb-1">Tasks heute</div>
            <div className="text-3xl font-bold">0/5</div>
          </div>
        </div>

        {/* Premium Banner (for free users) */}
        {!isPremium && (
          <div className="relative overflow-hidden rounded-2xl p-6 mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Premium Feature</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Schalte alle Features frei</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Erhalte detaillierte Analysen, deinen personalisierten Plan und Zugang zum AI Coach.
              </p>
              <Link to="/pricing">
                <Button variant="hero">
                  Premium werden
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Schnellzugriff</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link 
                key={action.title}
                to={action.premium && !isPremium ? "/pricing" : action.href}
                className="group relative p-6 rounded-2xl glass-card hover:border-primary/50 transition-all duration-300"
              >
                {action.premium && !isPremium && (
                  <div className="absolute top-3 right-3">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Get Started CTA */}
        <div className="text-center p-8 rounded-2xl glass-card">
          <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Starte deine erste Analyse</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Lade ein Foto hoch und erhalte in wenigen Sekunden deinen Looks Score.
          </p>
          <Link to="/analyse">
            <Button variant="hero" size="lg">
              <Camera className="w-5 h-5" />
              Foto analysieren
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;