import { useState } from "react";
import { Star, ExternalLink, ShoppingBag, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  targetIssues: string[];
  priceRange: string;
  rating: number;
  affiliateLink?: string | null;
  imageUrl?: string | null;
}

interface ProductRecommendationsCardProps {
  products: Product[];
  loading: boolean;
  maxDisplay?: number;
  title?: string;
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
  budget: { label: "€", color: "text-green-500" },
  medium: { label: "€€", color: "text-yellow-500" },
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

export const ProductRecommendationsCard = ({
  products,
  loading,
  maxDisplay = 4,
  title = "Für dich empfohlen",
}: ProductRecommendationsCardProps) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const displayProducts = products.slice(0, maxDisplay);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBuyClick = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Open Google search for buying the product
    const searchQuery = encodeURIComponent(`${product.brand} ${product.name} kaufen`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
  };

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

  const ProductItem = ({ product, index }: { product: Product; index: number }) => (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => handleProductClick(product)}
      className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-all group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
        {categoryIcons[product.category] || "📦"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{product.name}</h4>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn("text-xs font-medium", priceLabels[product.priceRange]?.color)}>
              {priceLabels[product.priceRange]?.label || "€€"}
            </span>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs">{product.rating}</span>
            </div>
          </div>
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
        onClick={(e) => handleBuyClick(product, e)}
      >
        <ShoppingCart className="w-4 h-4" />
      </Button>
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl glass-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {title}
          </h3>
          <Badge variant="outline" className="text-xs">
            {products.length} Produkte
          </Badge>
        </div>

        <div className="space-y-3">
          {displayProducts.map((product, index) => (
            <ProductItem key={product.id} product={product} index={index} />
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
      </motion.div>

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
              <ProductItem key={product.id} product={product} index={index} />
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
                <div className="flex items-center gap-3">
                  <span className={cn("text-lg font-bold", priceLabels[selectedProduct.priceRange]?.color)}>
                    {priceLabels[selectedProduct.priceRange]?.label || "€€"}
                  </span>
                  <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{selectedProduct.rating}</span>
                  </div>
                </div>
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
                <ShoppingCart className="w-4 h-4 mr-2" />
                Produkt kaufen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};