import { useState } from "react";
import { PlayerEconomy, ShopItem, SHOP_ITEMS, canAfford, purchaseItem } from "@/game/economySystem";
import { Era } from "@/game/gameData";

interface ShopScreenProps {
  era: Era;
  economy: PlayerEconomy;
  onPurchase: (economy: PlayerEconomy) => void;
  onStartBattle: () => void;
  onBack: () => void;
}

const ShopScreen = ({ era, economy, onPurchase, onStartBattle, onBack }: ShopScreenProps) => {
  const [selectedCategory, setSelectedCategory] = useState<"weapon" | "armor" | "ability">("weapon");
  const [flash, setFlash] = useState<string | null>(null);

  const filteredItems = SHOP_ITEMS.filter(i => i.category === selectedCategory);

  const handleBuy = (item: ShopItem) => {
    if (canAfford(economy, item)) {
      onPurchase(purchaseItem(economy, item));
      setFlash(item.id);
      setTimeout(() => setFlash(null), 500);
    }
  };

  const categories = [
    { id: "weapon" as const, label: "Weapons", emoji: "🔫" },
    { id: "armor" as const, label: "Armor", emoji: "🛡️" },
    { id: "ability" as const, label: "Abilities", emoji: "⚡" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <button onClick={onBack} className="absolute top-4 left-4 btn-attack text-xs px-3 py-1.5">
        ← Back
      </button>

      <div className="flex items-center gap-3 mb-2">
        <h2 className="font-display font-bold text-3xl gold-gradient-text">⚒️ ARMORY</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-1 font-body">{era.name} Loadout</p>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🪙</span>
        <span className="font-display font-bold text-2xl text-primary">{economy.coins}</span>
        <span className="text-muted-foreground text-sm font-body">coins</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`font-display text-sm px-4 py-2 rounded-lg transition-all ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8">
        {filteredItems.map(item => {
          const owned = economy.purchases.includes(item.id);
          const affordable = canAfford(economy, item);
          return (
            <button
              key={item.id}
              onClick={() => handleBuy(item)}
              disabled={owned || !affordable}
              className={`card-battle p-4 text-left transition-all ${
                flash === item.id ? "scale-105 border-primary" : ""
              } ${owned ? "opacity-60" : ""} ${!affordable && !owned ? "opacity-40" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xl mb-1">{item.emoji}</div>
                  <h3 className="font-display font-bold text-sm text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{item.description}</p>
                </div>
                <div className="text-right">
                  {owned ? (
                    <span className="text-xs font-display text-green-400">OWNED ✓</span>
                  ) : (
                    <span className="font-display text-sm text-primary">🪙 {item.price}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onStartBattle} className="btn-gold text-lg animate-pulse-glow">
        ⚔️ Enter Battle
      </button>
    </div>
  );
};

export default ShopScreen;
