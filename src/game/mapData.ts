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
    building: "#B8860B",
  },
  medieval: {
    ground: "#556B2F",
    walls: "#696969",
    cover: "#808080",
    platform: "#A9A9A9",
    sky: "#B0C4DE",
    ambient: "#CD5C5C",
    building: "#8B8682",
  },
  modern: {
    ground: "#505050",
    walls: "#3a3a3a",
    cover: "#6b6b6b",
    platform: "#888888",
    sky: "#c0d0e0",
    ambient: "#e8e8e8",
    building: "#5a5a5a",
  },
  future: {
    ground: "#1a1a2e",
    walls: "#16213e",
    cover: "#0f3460",
    platform: "#533483",
    sky: "#0a0a1a",
    ambient: "#00bcd4",
    building: "#2a1a4e",
  },
};

// Enhanced map with buildings, towers, verticality
export function generateMap(): MapBlock[] {
  const blocks: MapBlock[] = [];

  // Ground plane
  blocks.push({
    position: { x: 0, y: -0.5, z: 0 },
    size: { x: 50, y: 1, z: 50 },
    color: "ground",
    type: "ground",
  });

  // Perimeter walls
  const wallHeight = 5;
  const wallThickness = 1;
  const mapSize = 24;

  blocks.push({ position: { x: 0, y: wallHeight / 2, z: -mapSize }, size: { x: mapSize * 2, y: wallHeight, z: wallThickness }, color: "walls", type: "wall" });
  blocks.push({ position: { x: 0, y: wallHeight / 2, z: mapSize }, size: { x: mapSize * 2, y: wallHeight, z: wallThickness }, color: "walls", type: "wall" });
  blocks.push({ position: { x: mapSize, y: wallHeight / 2, z: 0 }, size: { x: wallThickness, y: wallHeight, z: mapSize * 2 }, color: "walls", type: "wall" });
  blocks.push({ position: { x: -mapSize, y: wallHeight / 2, z: 0 }, size: { x: wallThickness, y: wallHeight, z: mapSize * 2 }, color: "walls", type: "wall" });

  // Center tower
  blocks.push({ position: { x: 0, y: 2, z: 0 }, size: { x: 4, y: 4, z: 4 }, color: "building", type: "wall" });
  blocks.push({ position: { x: 0, y: 4.5, z: 0 }, size: { x: 5, y: 0.5, z: 5 }, color: "platform", type: "platform" });

  // Building NW
  blocks.push({ position: { x: -14, y: 1.5, z: -14 }, size: { x: 6, y: 3, z: 6 }, color: "building", type: "wall" });
  blocks.push({ position: { x: -14, y: 3.5, z: -14 }, size: { x: 7, y: 0.5, z: 7 }, color: "platform", type: "platform" });

  // Building SE
  blocks.push({ position: { x: 14, y: 1.5, z: 14 }, size: { x: 6, y: 3, z: 6 }, color: "building", type: "wall" });
  blocks.push({ position: { x: 14, y: 3.5, z: 14 }, size: { x: 7, y: 0.5, z: 7 }, color: "platform", type: "platform" });

  // Cover walls (L-shapes, scattered)
  blocks.push({ position: { x: -8, y: 0.75, z: 0 }, size: { x: 4, y: 1.5, z: 0.5 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: -6, y: 0.75, z: -1.5 }, size: { x: 0.5, y: 1.5, z: 3 }, color: "cover", type: "cover" });

  blocks.push({ position: { x: 8, y: 0.75, z: 0 }, size: { x: 4, y: 1.5, z: 0.5 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 10, y: 0.75, z: 1.5 }, size: { x: 0.5, y: 1.5, z: 3 }, color: "cover", type: "cover" });

  blocks.push({ position: { x: 0, y: 0.75, z: -9 }, size: { x: 0.5, y: 1.5, z: 4 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 0, y: 0.75, z: 9 }, size: { x: 0.5, y: 1.5, z: 4 }, color: "cover", type: "cover" });

  // Corner cover blocks
  blocks.push({ position: { x: -18, y: 0.75, z: -18 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 18, y: 0.75, z: -18 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: -18, y: 0.75, z: 18 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 18, y: 0.75, z: 18 }, size: { x: 2, y: 1.5, z: 2 }, color: "cover", type: "cover" });

  // Elevated sniper platforms
  blocks.push({ position: { x: -16, y: 2, z: 0 }, size: { x: 3, y: 0.5, z: 3 }, color: "platform", type: "platform" });
  blocks.push({ position: { x: -16, y: 1, z: 1.5 }, size: { x: 3, y: 0.3, z: 1.5 }, color: "platform", type: "platform" }); // ramp
  blocks.push({ position: { x: 16, y: 2, z: 0 }, size: { x: 3, y: 0.5, z: 3 }, color: "platform", type: "platform" });
  blocks.push({ position: { x: 16, y: 1, z: -1.5 }, size: { x: 3, y: 0.3, z: 1.5 }, color: "platform", type: "platform" }); // ramp

  // Mid-field barricades
  blocks.push({ position: { x: -5, y: 0.5, z: -5 }, size: { x: 2, y: 1, z: 0.5 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 5, y: 0.5, z: 5 }, size: { x: 2, y: 1, z: 0.5 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: 5, y: 0.5, z: -5 }, size: { x: 0.5, y: 1, z: 2 }, color: "cover", type: "cover" });
  blocks.push({ position: { x: -5, y: 0.5, z: 5 }, size: { x: 0.5, y: 1, z: 2 }, color: "cover", type: "cover" });

  return blocks;
}

// Spawn points for enemies
export const SPAWN_POINTS = [
  { x: -20, y: 0.5, z: -20 },
  { x: 20, y: 0.5, z: -20 },
  { x: -20, y: 0.5, z: 20 },
  { x: 20, y: 0.5, z: 20 },
  { x: -10, y: 0.5, z: 10 },
  { x: 10, y: 0.5, z: -10 },
  { x: 0, y: 0.5, z: -18 },
  { x: -18, y: 0.5, z: 0 },
];

// Player spawn
export const PLAYER_SPAWN = { x: 0, y: 0.5, z: 18 };
