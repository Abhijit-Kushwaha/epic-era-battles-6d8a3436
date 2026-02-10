// Economy & shop system

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  category: "weapon" | "armor" | "ability";
  stat: string;
  value: number;
}

export interface PlayerEconomy {
  coins: number;
  totalEarned: number;
  purchases: string[];
}

export const KILL_REWARD = 50;
export const WIN_BONUS = 200;
export const ASSIST_REWARD = 20;

export const SHOP_ITEMS: ShopItem[] = [
  // Weapons
  { id: "dmg_1", name: "Sharp Ammo", emoji: "🗡️", description: "+15% weapon damage", price: 100, category: "weapon", stat: "damage", value: 1.15 },
  { id: "dmg_2", name: "Piercing Rounds", emoji: "⚡", description: "+30% weapon damage", price: 250, category: "weapon", stat: "damage", value: 1.30 },
  { id: "rate_1", name: "Quick Loader", emoji: "💨", description: "+20% fire rate", price: 150, category: "weapon", stat: "fireRate", value: 1.20 },
  { id: "mag_1", name: "Extended Mag", emoji: "📦", description: "+50% ammo capacity", price: 120, category: "weapon", stat: "magSize", value: 1.50 },

  // Armor
  { id: "armor_1", name: "Light Vest", emoji: "🦺", description: "+25 max HP", price: 100, category: "armor", stat: "hp", value: 25 },
  { id: "armor_2", name: "Heavy Armor", emoji: "🛡️", description: "+50 max HP", price: 250, category: "armor", stat: "hp", value: 50 },
  { id: "armor_3", name: "Titan Plate", emoji: "⚙️", description: "+100 max HP", price: 500, category: "armor", stat: "hp", value: 100 },

  // Abilities
  { id: "speed_1", name: "Sprint Boost", emoji: "👟", description: "+20% move speed", price: 150, category: "ability", stat: "speed", value: 1.20 },
  { id: "regen_1", name: "Health Regen", emoji: "💚", description: "Slow HP regeneration", price: 200, category: "ability", stat: "regen", value: 2 },
  { id: "reload_1", name: "Fast Hands", emoji: "🤲", description: "-30% reload time", price: 180, category: "ability", stat: "reloadSpeed", value: 0.70 },
];

export function createEconomy(): PlayerEconomy {
  return { coins: 0, totalEarned: 0, purchases: [] };
}

export function canAfford(economy: PlayerEconomy, item: ShopItem): boolean {
  return economy.coins >= item.price && !economy.purchases.includes(item.id);
}

export function purchaseItem(economy: PlayerEconomy, item: ShopItem): PlayerEconomy {
  if (!canAfford(economy, item)) return economy;
  return {
    ...economy,
    coins: economy.coins - item.price,
    purchases: [...economy.purchases, item.id],
  };
}

export function addCoins(economy: PlayerEconomy, amount: number): PlayerEconomy {
  return {
    ...economy,
    coins: economy.coins + amount,
    totalEarned: economy.totalEarned + amount,
  };
}
