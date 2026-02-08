import arenaAncient from "@/assets/arena-ancient.jpg";
import arenaMedieval from "@/assets/arena-medieval.jpg";
import arenaFuture from "@/assets/arena-future.jpg";

export interface Fighter {
  id: string;
  name: string;
  era: string;
  title: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  specialName: string;
  specialDamage: number;
  specialCooldown: number;
}

export interface Era {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  bgImage: string;
  color: string;
  fighters: Fighter[];
}

export const ERAS: Era[] = [
  {
    id: "ancient",
    name: "Ancient Era",
    subtitle: "500 BC – 400 AD",
    description: "Warriors of the ancient world clash in the Colosseum",
    bgImage: arenaAncient,
    color: "hsl(42, 85%, 55%)",
    fighters: [
      {
        id: "gladiator",
        name: "Maximus",
        era: "ancient",
        title: "Roman Gladiator",
        emoji: "⚔️",
        hp: 100,
        maxHp: 100,
        attack: 22,
        defense: 15,
        speed: 12,
        specialName: "Gladius Fury",
        specialDamage: 40,
        specialCooldown: 3,
      },
      {
        id: "spartan",
        name: "Leonidas",
        era: "ancient",
        title: "Spartan King",
        emoji: "🛡️",
        hp: 120,
        maxHp: 120,
        attack: 18,
        defense: 22,
        speed: 10,
        specialName: "Phalanx Charge",
        specialDamage: 35,
        specialCooldown: 3,
      },
      {
        id: "pharaoh",
        name: "Ramesses",
        era: "ancient",
        title: "Egyptian Pharaoh",
        emoji: "🏛️",
        hp: 90,
        maxHp: 90,
        attack: 25,
        defense: 12,
        speed: 14,
        specialName: "Sun God's Wrath",
        specialDamage: 45,
        specialCooldown: 4,
      },
    ],
  },
  {
    id: "medieval",
    name: "Medieval Era",
    subtitle: "500 AD – 1500 AD",
    description: "Knights and conquerors battle for kingdoms",
    bgImage: arenaMedieval,
    color: "hsl(0, 70%, 50%)",
    fighters: [
      {
        id: "knight",
        name: "Sir Galahad",
        era: "medieval",
        title: "Templar Knight",
        emoji: "🗡️",
        hp: 110,
        maxHp: 110,
        attack: 20,
        defense: 20,
        speed: 10,
        specialName: "Holy Strike",
        specialDamage: 38,
        specialCooldown: 3,
      },
      {
        id: "viking",
        name: "Ragnar",
        era: "medieval",
        title: "Viking Berserker",
        emoji: "🪓",
        hp: 95,
        maxHp: 95,
        attack: 28,
        defense: 10,
        speed: 15,
        specialName: "Berserker Rage",
        specialDamage: 50,
        specialCooldown: 4,
      },
      {
        id: "samurai",
        name: "Musashi",
        era: "medieval",
        title: "Samurai Master",
        emoji: "⛩️",
        hp: 100,
        maxHp: 100,
        attack: 24,
        defense: 14,
        speed: 18,
        specialName: "Blade Storm",
        specialDamage: 42,
        specialCooldown: 3,
      },
    ],
  },
  {
    id: "future",
    name: "Future Era",
    subtitle: "2200 AD+",
    description: "Cybernetic warriors unleash devastating tech",
    bgImage: arenaFuture,
    color: "hsl(200, 80%, 50%)",
    fighters: [
      {
        id: "cyborg",
        name: "Unit-X7",
        era: "future",
        title: "Combat Cyborg",
        emoji: "🤖",
        hp: 105,
        maxHp: 105,
        attack: 24,
        defense: 18,
        speed: 14,
        specialName: "Plasma Blast",
        specialDamage: 44,
        specialCooldown: 3,
      },
      {
        id: "mech",
        name: "Titan-01",
        era: "future",
        title: "Mech Pilot",
        emoji: "🦾",
        hp: 130,
        maxHp: 130,
        attack: 20,
        defense: 25,
        speed: 8,
        specialName: "Orbital Strike",
        specialDamage: 55,
        specialCooldown: 5,
      },
      {
        id: "psion",
        name: "Nova",
        era: "future",
        title: "Psionic Operative",
        emoji: "🔮",
        hp: 80,
        maxHp: 80,
        attack: 30,
        defense: 8,
        speed: 20,
        specialName: "Mind Shatter",
        specialDamage: 48,
        specialCooldown: 3,
      },
    ],
  },
];
