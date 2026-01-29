import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroceryList } from "@/hooks/useGroceryList";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check,
  Loader2,
  ListPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

export function GroceryListTracker() {
  const { 
    activeList,
    items,
    itemsByCategory,
    stats,
    categories,
    loading,
    createList,
    addItem,
    toggleItem,
    deleteItem,
    clearCheckedItems
  } = useGroceryList();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "1",
    unit: "",
    category: "other"
  });

  const handleAddItem = async () => {
    if (!formData.item_name) return;

    await addItem({
      item_name: formData.item_name,
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit || null,
      category: formData.category,
      recipe_id: null
    });

    setFormData({ item_name: "", quantity: "1", unit: "", category: "other" });
    setShowAddDialog(false);
  };

  const handleCreateList = async () => {
    if (!newListName) return;
    await createList(newListName);
    setNewListName("");
    setShowNewListDialog(false);
  };

  const progressPercent = stats.total > 0 ? (stats.checked / stats.total) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If no list exists, show create prompt
  if (!activeList) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Keine Einkaufsliste</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Erstelle deine erste Einkaufsliste
          </p>
          <Dialog open={showNewListDialog} onOpenChange={setShowNewListDialog}>
            <DialogTrigger asChild>
              <Button>
                <ListPlus className="h-4 w-4 mr-2" />
                Liste erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Einkaufsliste</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Name der Liste"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <Button className="w-full" onClick={handleCreateList}>
                  Erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {activeList.name}
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Artikel hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Artikel Name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Menge"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                  <Input
                    placeholder="Einheit (g, ml, Stk)"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" onClick={handleAddItem}>
                  Hinzufügen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {stats.checked} von {stats.total} erledigt
            </span>
            {stats.checked > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs h-7"
                onClick={clearCheckedItems}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Erledigte löschen
              </Button>
            )}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Items by Category */}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Artikel auf der Liste
          </p>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const categoryItems = itemsByCategory[cat.value];
              if (!categoryItems || categoryItems.length === 0) return null;
              
              return (
                <div key={cat.value}>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span>{cat.icon}</span>
                    {cat.label}
                  </h4>
                  <div className="space-y-1">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg transition-colors",
                          item.is_checked ? "bg-muted/30" : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={item.is_checked}
                          onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
                        />
                        <div className={cn(
                          "flex-1",
                          item.is_checked && "line-through text-muted-foreground"
                        )}>
                          <span className="text-sm">{item.item_name}</span>
                          {(item.quantity !== 1 || item.unit) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {item.quantity}{item.unit && ` ${item.unit}`}
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
