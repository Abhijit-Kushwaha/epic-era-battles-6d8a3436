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
  color: string;
}

export interface HistoricalFact {
  era: string;
  fact: string;
  lesson: string;
}

export interface Era {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  bgImage: string;
  color: string;
  fighters: Fighter[];
  facts: HistoricalFact[];
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
        speed: 5,
        specialName: "Gladius Fury",
        specialDamage: 40,
        color: "#c8a84e",
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
        speed: 4,
        specialName: "Phalanx Charge",
        specialDamage: 35,
        color: "#8b0000",
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
        speed: 6,
        specialName: "Sun God's Wrath",
        specialDamage: 45,
        color: "#d4a017",
      },
    ],
    facts: [
      { era: "ancient", fact: "The Roman Colosseum could hold 50,000–80,000 spectators and had a retractable roof.", lesson: "Engineering mastery existed thousands of years ago — innovation isn't new!" },
      { era: "ancient", fact: "Spartans trained for war from age 7. The word 'spartan' now means strict discipline.", lesson: "Discipline and training can overcome superior numbers." },
      { era: "ancient", fact: "Ancient Egypt had female pharaohs, including Hatshepsut who ruled for 20 years.", lesson: "Leadership knows no gender — history proves it." },
      { era: "ancient", fact: "The Battle of Thermopylae (480 BC): 300 Spartans held off a Persian army of 100,000+.", lesson: "Courage and strategy can overcome overwhelming odds." },
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
        speed: 4,
        specialName: "Holy Strike",
        specialDamage: 38,
        color: "#c0c0c0",
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
        speed: 6,
        specialName: "Berserker Rage",
        specialDamage: 50,
        color: "#4a6741",
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
        speed: 7,
        specialName: "Blade Storm",
        specialDamage: 42,
        color: "#b22222",
      },
    ],
    facts: [
      { era: "medieval", fact: "Vikings were actually skilled traders and explorers — they reached North America 500 years before Columbus.", lesson: "Don't judge a culture by stereotypes — dig deeper!" },
      { era: "medieval", fact: "Samurai followed 'Bushido' — a code of honor, loyalty, and self-discipline.", lesson: "True strength comes from character, not just combat." },
      { era: "medieval", fact: "Medieval knights' armor weighed 20–25 kg. They trained from childhood to fight in it.", lesson: "Preparation is everything — skill takes years to build." },
      { era: "medieval", fact: "The Mongol Empire was the largest contiguous land empire, spanning 24 million km².", lesson: "Unity and organization can build something extraordinary." },
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
        speed: 6,
        specialName: "Plasma Blast",
        specialDamage: 44,
        color: "#00bcd4",
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
        speed: 3,
        specialName: "Orbital Strike",
        specialDamage: 55,
        color: "#607d8b",
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
        speed: 8,
        specialName: "Mind Shatter",
        specialDamage: 48,
        color: "#9c27b0",
      },
    ],
    facts: [
      { era: "future", fact: "AI was first conceptualized by Alan Turing in 1950 with the 'Turing Test'.", lesson: "Today's technology stands on the shoulders of past visionaries." },
      { era: "future", fact: "The first video game was created in 1958 — 'Tennis for Two' on an oscilloscope.", lesson: "Every revolution starts small — your ideas matter!" },
      { era: "future", fact: "Quantum computers can solve in minutes what would take classical computers millions of years.", lesson: "New approaches can solve 'impossible' problems." },
      { era: "future", fact: "Space travel technology from the 1960s had less computing power than a modern smartphone.", lesson: "Resourcefulness and creativity matter more than raw power." },
    ],
  },
];
