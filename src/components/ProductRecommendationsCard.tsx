import { useState, memo, useCallback, useMemo } from "react";
import { ExternalLink, ShoppingBag, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  targetIssues: string[];
  priceRange: string;
  rating?: number;
  affiliateLink?: string | null;
  imageUrl?: string | null;
  matchScore?: number;
}

interface ProductRecommendationsCardProps {
  products: Product[];
  loading: boolean;
  maxDisplay?: number;
  title?: string;
  hasPersonalizedResults?: boolean;
}

const categoryIcons: Record<string, string> = {
  serum: "💧",
  treatment: "⚗️",
  exfoliant: "✨",
  sunscreen: "☀️",
  hair: "💇",
  tool: "🔧",
};

const priceLabels: Record<string, { label: string; color: string }> = {
  budget: { label: "€", color: "text-emerald-500" },
  medium: { label: "€€", color: "text-amber-500" },
  premium: { label: "€€€", color: "text-orange-500" },
};

const categoryNames: Record<string, string> = {
  serum: "Serum",
  treatment: "Behandlung",
  exfoliant: "Peeling",
  sunscreen: "Sonnenschutz",
  hair: "Haarpflege",
  tool: "Werkzeug",
};

// Memoized product item component
const ProductItem = memo(({ 
  product, 
  index, 
  onProductClick,
  onBuyClick,
  shouldReduce
}: { 
  product: Product; 
  index: number;
  onProductClick: (product: Product) => void;
  onBuyClick: (product: Product, e?: React.MouseEvent) => void;
  shouldReduce: boolean;
}) => {
  const isHighMatch = product.matchScore && product.matchScore >= 5;
  
  return (
    <div
      onClick={() => onProductClick(product)}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors group cursor-pointer relative",
        isHighMatch && "ring-1 ring-primary/30 bg-primary/5",
        !shouldReduce && "animate-fade-in"
      )}
      style={shouldReduce ? {} : { animationDelay: `${index * 30}ms` }}
    >
      {isHighMatch && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          Top-Match
        </div>
      )}
      
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
        {categoryIcons[product.category] || "📦"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{product.name}</h4>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          </div>
          <span className={cn("text-xs font-medium flex-shrink-0", priceLabels[product.priceRange]?.color)}>
            {priceLabels[product.priceRange]?.label || "€€"}
          </span>
        </div>

        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        {product.targetIssues.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.targetIssues.slice(0, 3).map((issue) => (
              <Badge
                key={issue}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {issue.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => onBuyClick(product, e)}
      >
        <ShoppingCart className="w-4 h-4" />
      </Button>
    </div>
  );
});

ProductItem.displayName = "ProductItem";

export const ProductRecommendationsCard = memo(({
  products,
  loading,
  maxDisplay = 4,
  title = "Für dich empfohlen",
  hasPersonalizedResults = false,
}: ProductRecommendationsCardProps) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const shouldReduce = useReducedMotion();
  
  const displayProducts = useMemo(() => products.slice(0, maxDisplay), [products, maxDisplay]);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleBuyClick = useCallback((product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (product.affiliateLink) {
      window.open(product.affiliateLink, "_blank", "noopener,noreferrer");
    } else {
      const searchQuery = encodeURIComponent(`${product.brand} ${product.name}`);
      window.open(`https://www.amazon.de/s?k=${searchQuery}&tag=looksmaxing-21`, "_blank", "noopener,noreferrer");
    }
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl glass-card animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <div className="p-5 rounded-2xl glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {title}
            </h3>
            {hasPersonalizedResults && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Basierend auf deiner Analyse
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {products.length} Produkte
          </Badge>
        </div>

        <div className="space-y-3">
          {displayProducts.map((product, index) => (
            <ProductItem 
              key={product.id} 
              product={product} 
              index={index}
              onProductClick={handleProductClick}
              onBuyClick={handleBuyClick}
              shouldReduce={shouldReduce}
            />
          ))}
        </div>

        {products.length > maxDisplay && (
          <Button 
            variant="ghost" 
            className="w-full mt-3 text-sm"
            onClick={() => setShowAllProducts(true)}
          >
            Alle {products.length} Produkte anzeigen
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* All Products Dialog */}
      <Dialog open={showAllProducts} onOpenChange={setShowAllProducts}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Alle empfohlenen Produkte ({products.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {products.map((product, index) => (
              <ProductItem 
                key={product.id} 
                product={product} 
                index={index}
                onProductClick={handleProductClick}
                onBuyClick={handleBuyClick}
                shouldReduce={shouldReduce}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{categoryIcons[selectedProduct?.category || ""] || "📦"}</span>
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{selectedProduct.brand}</p>
                  <p className="text-sm text-muted-foreground">{categoryNames[selectedProduct.category] || selectedProduct.category}</p>
                </div>
                <span className={cn("text-lg font-bold", priceLabels[selectedProduct.priceRange]?.color)}>
                  {priceLabels[selectedProduct.priceRange]?.label || "€€"}
                </span>
              </div>

              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedProduct.description}
                </p>
              )}

              {selectedProduct.targetIssues.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Hilft bei:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.targetIssues.map((issue) => (
                      <Badge key={issue} variant="secondary">
                        {issue.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-4" 
                onClick={() => handleBuyClick(selectedProduct)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Auf Amazon suchen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

ProductRecommendationsCard.displayName = "ProductRecommendationsCard";
