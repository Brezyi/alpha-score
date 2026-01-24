import { Phone, Heart, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CrisisHotlineCardProps {
  onDismiss?: () => void;
}

export function CrisisHotlineCard({ onDismiss }: CrisisHotlineCardProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-destructive/10 to-accent/10 border-destructive/30 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Du bist nicht allein 💙</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Bei psychischen Problemen gibt es professionelle Hilfe. Diese Menschen sind für dich da:
          </p>
          
          <div className="space-y-2">
            <a 
              href="tel:0800-1110111" 
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-medium">Telefonseelsorge:</span>
              <span className="text-primary">0800 111 0 111</span>
              <span className="text-xs text-muted-foreground">(kostenlos, 24/7)</span>
            </a>
            
            <a 
              href="tel:0800-1110222" 
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-medium">Alternativ:</span>
              <span className="text-primary">0800 111 0 222</span>
              <span className="text-xs text-muted-foreground">(kostenlos, 24/7)</span>
            </a>

            <a 
              href="https://online.telefonseelsorge.de" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>Online-Chat Beratung</span>
            </a>
          </div>

          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 text-xs text-muted-foreground"
              onClick={onDismiss}
            >
              Verstanden
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
