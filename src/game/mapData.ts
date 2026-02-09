import { MapBlock } from "./types3d";

// Era-specific color palettes
export const ERA_COLORS = {
  ancient: {
    ground: "#8B7355",
    walls: "#A0522D",
    cover: "#D2B48C",
    platform: "#CD853F",
    sky: "#87CEEB",
    ambient: "#FFD700",
  },
  medieval: {
    ground: "#556B2F",
    walls: "#696969",
    cover: "#808080",
    platform: "#A9A9A9",
    sky: "#B0C4DE",
    ambient: "#CD5C5C",
  },
  future: {
    ground: "#1a1a2e",
    walls: "#16213e",
    cover: "#0f3460",
    platform: "#533483",
    sky: "#0a0a1a",
    ambient: "#00bcd4",
  },
};

// Small arena map - works for all eras (colors applied per-era)
export function generateMap(): MapBlock[] {
  const blocks: MapBlock[] = [];

  // Ground plane (large flat area)
  blocks.push({
    position: { x: 0, y: -0.5, z: 0 },
    size: { x: 40, y: 1, z: 40 },
    color: "ground",
    type: "ground",
  });

  // Perimeter walls
  const wallHeight = 4;
  const wallThickness = 1;
  const mapSize = 20;

  // North wall
  blocks.push({ position: { x: 0, y: wallHeight / 2, z: -mapSize }, size: { x: mapSize * 2, y: wallHeight, z: wallThickness }, color: "walls", type: "wall" });
  // South wall
  blocks.push({ position: { x: 0, y: wallHeight / 2, z: mapSize }, size: { x: mapSize * 2, y: wallHeight, z: wallThickness }, color: "walls", type: "wall" });
  // East wall
  blocks.push({ position: { x: mapSize, y: wallHeight / 2, z: 0 }, size: { x: wallThickness, y: wallHeight, z: mapSize * 2 }, color: "walls", type: "wall" });
  // West wall
  blocks.push({ position: { x: -mapSize, y: wallHeight / 2, z: 0 }, size: { x: wallThickness, y: wallHeight, z: mapSize * 2 }, color: "walls", type: "wall" });

  // Cover objects scattered around
  // Center structure
  blocks.push({ position: { x: 0, y: 1, z: 0 }, size: { x: 3, y: 2, z: 3 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 0, y: 2.5, z: 0 }, size: { x: 4, y: 0.5, z: 4 }, color: "platform", type: "platform" });

  // Corner covers
  blocks.push({ position: { x: -10, y: 0.75, z: -10 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 10, y: 0.75, z: -10 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: -10, y: 0.75, z: 10 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 10, y: 0.75, z: 10 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });

  // Mid cover
  blocks.push({ position: { x: -6, y: 0.5, z: 0 }, size: { x: 3, y: 1, z: 1 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 6, y: 0.5, z: 0 }, size: { x: 3, y: 1, z: 1 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 0, y: 0.5, z: -7 }, size: { x: 1, y: 1, z: 3 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 0, y: 0.5, z: 7 }, size: { x: 1, y: 1, z: 3 }, color: "cover", type: "cover" });

  // Elevated platforms
  blocks.push({ position: { x: -12, y: 1.5, z: -5 }, size: { x: 3, y: 0.5, z: 3 }, color: "platform", type: "platform" });
  blocks.push({ position: { x: 12, y: 1.5, z: 5 }, size: { x: 3, y: 0.5, z: 3 }, color: "platform", type: "platform" });

  // Ramps (angled platforms for access)
  blocks.push({ position: { x: -12, y: 0.75, z: -3 }, size: { x: 3, y: 0.3, z: 2 }, color: "platform", type: "platform" });
  blocks.push({ position: { x: 12, y: 0.75, z: 7 }, size: { x: 3, y: 0.3, z: 2 }, color: "platform", type: "platform" });

  return blocks;
}

// Spawn points for enemies
export const SPAWN_POINTS = [
  { x: -15, y: 0.5, z: -15 },
  { x: 15, y: 0.5, z: -15 },
  { x: -15, y: 0.5, z: 15 },
  { x: 15, y: 0.5, z: 15 },
  { x: -8, y: 0.5, z: 8 },
  { x: 8, y: 0.5, z: -8 },
];

// Player spawn
export const PLAYER_SPAWN = { x: 0, y: 0.5, z: 15 };
