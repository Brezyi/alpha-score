import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  Copy, 
  Share2, 
  TrendingUp,
  Wallet,
  ChevronRight
} from "lucide-react";
import { useAffiliate } from "@/hooks/useAffiliate";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface AffiliateCardProps {
  className?: string;
  compact?: boolean;
}

export function AffiliateCard({ className, compact = false }: AffiliateCardProps) {
  const { referralCode, stats, copyReferralLink, isLoading } = useAffiliate();

  if (isLoading) {
    return (
      <Card className={cn("p-5 animate-pulse", className)}>
        <div className="h-32 bg-muted rounded-lg" />
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn("p-4 glass-card", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Affiliate Programm</h3>
              <p className="text-xs text-muted-foreground">
                20% Provision pro Abo
              </p>
            </div>
          </div>
          <Link to="/affiliate">
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {stats.totalEarnings > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Verdient</span>
              <span className="font-bold text-green-500">
                €{stats.totalEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 glass-card overflow-hidden relative", className)}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Affiliate Programm</h2>
            <p className="text-sm text-muted-foreground">
              Verdiene 20% Provision für jedes Abo
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div 
            className="p-4 rounded-xl bg-muted/30 border border-border"
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
            className="p-4 rounded-xl bg-muted/30 border border-border"
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
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-xs">Ausstehend</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              €{stats.pendingEarnings.toFixed(2)}
            </div>
          </motion.div>

          <motion.div 
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Gesamt verdient</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              €{stats.totalEarnings.toFixed(2)}
            </div>
          </motion.div>
        </div>

        {/* Referral Code */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
          <div className="text-xs text-muted-foreground mb-2">Dein Affiliate-Code</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-background rounded-lg font-mono text-lg font-bold tracking-wider">
              {referralCode}
            </code>
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyReferralLink}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            onClick={copyReferralLink}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Link kopieren
          </Button>
          <Link to="/affiliate" className="flex-1">
            <Button variant="outline" className="w-full">
              Details ansehen
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
