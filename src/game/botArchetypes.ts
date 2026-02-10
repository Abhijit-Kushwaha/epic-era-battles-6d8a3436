// Bot archetype definitions with personality traits

export interface BotPersonality {
  aggression: number;   // 0-1: how aggressively they push
  accuracy: number;     // 0-1: shot accuracy (lower spread)
  awareness: number;    // 0-1: detection range multiplier
  courage: number;      // 0-1: HP threshold before fleeing
  reactionSpeed: number; // seconds delay before reacting
}

export interface BotArchetype {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  speed: number;
  fireInterval: number;
  damage: number;
  color: string;
  personality: BotPersonality;
  behavior: "rush" | "snipe" | "defend" | "flank" | "demolish" | "jetpack";
}

export const BOT_ARCHETYPES: BotArchetype[] = [
  {
    id: "berserker",
    name: "Berserker",
    emoji: "🔥",
    maxHp: 80,
    speed: 7,
    fireInterval: 1.2,
    damage: 8,
    color: "#ff4444",
    personality: { aggression: 0.9, accuracy: 0.4, awareness: 0.6, courage: 0.9, reactionSpeed: 0.3 },
    behavior: "rush",
  },
  {
    id: "sniper",
    name: "Sniper",
    emoji: "🎯",
    maxHp: 70,
    speed: 3,
    fireInterval: 3,
    damage: 18,
    color: "#44aa44",
    personality: { aggression: 0.2, accuracy: 0.85, awareness: 0.95, courage: 0.3, reactionSpeed: 0.8 },
    behavior: "snipe",
  },
  {
    id: "guardian",
    name: "Guardian",
    emoji: "🛡️",
    maxHp: 140,
    speed: 3.5,
    fireInterval: 2,
    damage: 7,
    color: "#4488ff",
    personality: { aggression: 0.3, accuracy: 0.5, awareness: 0.7, courage: 0.7, reactionSpeed: 0.5 },
    behavior: "defend",
  },
  {
    id: "flanker",
    name: "Flanker",
    emoji: "💨",
    maxHp: 90,
    speed: 6,
    fireInterval: 1.5,
    damage: 9,
    color: "#ff8800",
    personality: { aggression: 0.6, accuracy: 0.55, awareness: 0.8, courage: 0.5, reactionSpeed: 0.4 },
    behavior: "flank",
  },
  {
    id: "demolisher",
    name: "Demolisher",
    emoji: "💥",
    maxHp: 110,
    speed: 4,
    fireInterval: 2.5,
    damage: 15,
    color: "#aa4400",
    personality: { aggression: 0.7, accuracy: 0.45, awareness: 0.5, courage: 0.6, reactionSpeed: 0.6 },
    behavior: "demolish",
  },
];

// Randomize personality slightly for each bot instance
export function randomizePersonality(base: BotPersonality): BotPersonality {
  const vary = (v: number, range = 0.15) => Math.max(0, Math.min(1, v + (Math.random() - 0.5) * range));
  return {
    aggression: vary(base.aggression),
    accuracy: vary(base.accuracy),
    awareness: vary(base.awareness),
    courage: vary(base.courage),
    reactionSpeed: vary(base.reactionSpeed, 0.2),
  };
}

export function getRandomArchetype(): BotArchetype {
  return BOT_ARCHETYPES[Math.floor(Math.random() * BOT_ARCHETYPES.length)];
}
