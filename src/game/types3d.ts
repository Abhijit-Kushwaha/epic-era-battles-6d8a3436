// Core types for the 3D game

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Weapon {
  name: string;
  damage: number;
  range: number;
  fireRate: number; // shots per second
  reloadTime: number; // seconds
  magSize: number;
  projectileSpeed: number;
  emoji: string;
}

export interface EraWeapons {
  [eraId: string]: Weapon;
}

export const ERA_WEAPONS: EraWeapons = {
  ancient: {
    name: "Bow & Arrow",
    damage: 25,
    range: 40,
    fireRate: 1.2,
    reloadTime: 2,
    magSize: 5,
    projectileSpeed: 30,
    emoji: "🏹",
  },
  medieval: {
    name: "Crossbow",
    damage: 35,
    range: 50,
    fireRate: 0.8,
    reloadTime: 3,
    magSize: 3,
    projectileSpeed: 25,
    emoji: "⚔️",
  },
  future: {
    name: "Laser Rifle",
    damage: 20,
    range: 60,
    fireRate: 3,
    reloadTime: 1.5,
    magSize: 12,
    projectileSpeed: 60,
    emoji: "🔫",
  },
};

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  rotation: number; // Y-axis rotation
  hp: number;
  maxHp: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  isCrouching: boolean;
  isRunning: boolean;
  isGrounded: boolean;
  isDead: boolean;
  kills: number;
  deaths: number;
  lastFireTime: number;
}

export interface EnemyState {
  id: number;
  position: Vec3;
  velocity: Vec3;
  rotation: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
  respawnTimer: number;
  aiState: "idle" | "patrol" | "chase" | "attack" | "flee";
  targetPoint: Vec3;
  lastFireTime: number;
  ammo: number;
}

export interface Projectile {
  id: number;
  position: Vec3;
  velocity: Vec3;
  damage: number;
  ownerId: number | "player";
  lifetime: number;
}

export interface MapBlock {
  position: Vec3;
  size: Vec3;
  color: string;
  type: "ground" | "wall" | "cover" | "platform";
}
