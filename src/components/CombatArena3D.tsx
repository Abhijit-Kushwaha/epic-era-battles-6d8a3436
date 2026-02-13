import { useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Text, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Era, Fighter } from "@/game/gameData";
import { use3DGameEngine } from "@/game/use3DGameEngine";
import { ERA_COLORS } from "@/game/mapData";
import { MapBlock, EnemyState, Projectile, PlayerState, CameraMode, LockOnTarget } from "@/game/types3d";
import { PlayerEconomy } from "@/game/economySystem";
import Minimap from "./Minimap";
import NightVision from "./NightVision";
import { useNightVision } from "@/hooks/useNightVision";

interface CombatArena3DProps {
  era: Era;
  player: Fighter;
  economy?: PlayerEconomy;
  onEnd: (won: boolean, earnedCoins: number) => void;
}

// Camera controller with FPV/TPV modes
function CameraController({
  playerPos,
  mouseRotRef,
  isDead,
  cameraMode,
  isMoving,
  isRunning,
  lockOnTarget,
  mapBlocks,
}: {
  playerPos: { x: number; y: number; z: number };
  mouseRotRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  isDead: boolean;
  cameraMode: CameraMode;
  isMoving: boolean;
  isRunning: boolean;
  lockOnTarget: LockOnTarget | null;
  mapBlocks: MapBlock[];
}) {
  const { camera, gl } = useThree();
  const isLocked = useRef(false);
  const headBobPhase = useRef(0);
  const transitionProgress = useRef(cameraMode === "fpv" ? 1 : 0);

  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      if (!isLocked.current) canvas.requestPointerLock();
    };
    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      const sens = 0.002;
      mouseRotRef.current.yaw -= e.movementX * sens;
      mouseRotRef.current.pitch = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, mouseRotRef.current.pitch - e.movementY * sens)
      );
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [gl, mouseRotRef]);

  useFrame((_, delta) => {
    const { yaw, pitch } = mouseRotRef.current;

    // Smooth transition between modes (0 = TPV, 1 = FPV)
    const targetT = cameraMode === "fpv" ? 1 : 0;
    transitionProgress.current += (targetT - transitionProgress.current) * Math.min(1, delta * 5);
    const t = transitionProgress.current;

    // Head bob for FPV
    let bobX = 0, bobY = 0;
    if (isMoving && !isDead) {
      const bobSpeed = isRunning ? 14 : 9;
      const bobAmount = isRunning ? 0.06 : 0.03;
      headBobPhase.current += delta * bobSpeed;
      bobY = Math.sin(headBobPhase.current) * bobAmount;
      bobX = Math.cos(headBobPhase.current * 0.5) * bobAmount * 0.5;
    } else {
      headBobPhase.current *= 0.9;
    }

    // Lock-on: slightly adjust yaw/pitch toward target
    let effectiveYaw = yaw;
    let effectivePitch = pitch;
    if (lockOnTarget) {
      const dx = lockOnTarget.position.x - playerPos.x;
      const dz = lockOnTarget.position.z - playerPos.z;
      const dy = (lockOnTarget.position.y + 1) - (playerPos.y + 1.6);
      const targetYaw = Math.atan2(dx, dz);
      const horizontalDist = Math.sqrt(dx * dx + dz * dz);
      const targetPitch = Math.atan2(dy, horizontalDist);
      // Soft aim assist: blend 30% toward target
      effectiveYaw += (targetYaw - effectiveYaw) * 0.3;
      effectivePitch += (targetPitch - effectivePitch) * 0.3;
    }

    // FPV camera: at player head
    const fpvX = playerPos.x + bobX;
    const fpvY = playerPos.y + 1.6 + bobY;
    const fpvZ = playerPos.z;

    // TPV camera: behind player with collision
    const tpvDist = isDead ? 8 : 5;
    const tpvHeight = isDead ? 4 : 2.5;
    let tpvX = playerPos.x - Math.sin(effectiveYaw) * Math.cos(effectivePitch) * tpvDist;
    let tpvY = playerPos.y + tpvHeight - Math.sin(effectivePitch) * tpvDist * 0.3;
    let tpvZ = playerPos.z - Math.cos(effectiveYaw) * Math.cos(effectivePitch) * tpvDist;

    // Simple wall collision for TPV: raycast from player to camera
    const origin = new THREE.Vector3(playerPos.x, playerPos.y + 1.5, playerPos.z);
    const camDir = new THREE.Vector3(tpvX - origin.x, tpvY - origin.y, tpvZ - origin.z);
    const maxDist = camDir.length();
    camDir.normalize();
    let minClipDist = maxDist;
    for (const block of mapBlocks) {
      if (block.type === "ground") continue;
      const bMin = new THREE.Vector3(
        block.position.x - block.size.x / 2,
        block.position.y - block.size.y / 2,
        block.position.z - block.size.z / 2
      );
      const bMax = new THREE.Vector3(
        block.position.x + block.size.x / 2,
        block.position.y + block.size.y / 2,
        block.position.z + block.size.z / 2
      );
      const box = new THREE.Box3(bMin, bMax);
      const ray = new THREE.Ray(origin, camDir);
      const hitPoint = new THREE.Vector3();
      if (ray.intersectBox(box, hitPoint)) {
        const hitDist = origin.distanceTo(hitPoint);
        if (hitDist < minClipDist) minClipDist = hitDist - 0.3;
      }
    }
    if (minClipDist < maxDist && minClipDist > 0.5) {
      tpvX = origin.x + camDir.x * minClipDist;
      tpvY = origin.y + camDir.y * minClipDist;
      tpvZ = origin.z + camDir.z * minClipDist;
    }

    // Lerp between FPV and TPV
    const camX = fpvX * t + tpvX * (1 - t);
    const camY = fpvY * t + tpvY * (1 - t);
    const camZ = fpvZ * t + tpvZ * (1 - t);

    const lookTarget = new THREE.Vector3(
      playerPos.x + Math.sin(effectiveYaw) * 10,
      playerPos.y + 1.6 + Math.sin(effectivePitch) * 5,
      playerPos.z + Math.cos(effectiveYaw) * 10
    );
    const tpvLookTarget = new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z);

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
    const finalLook = new THREE.Vector3().lerpVectors(tpvLookTarget, lookTarget, t);
    camera.lookAt(finalLook);

    // Adjust FOV: FPV = 80, TPV = 70
    const targetFov = 80 * t + 70 * (1 - t);
    (camera as THREE.PerspectiveCamera).fov += (targetFov - (camera as THREE.PerspectiveCamera).fov) * 0.1;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  });

  return null;
}

// FPS weapon visible in first person
function FPSWeapon({ cameraMode, weapon, isReloading }: { cameraMode: CameraMode; weapon: { emoji: string }; isReloading: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    // Attach weapon to camera
    ref.current.position.copy(camera.position);
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.translateX(0.3);
    ref.current.translateY(-0.2);
    ref.current.translateZ(-0.5);
    // Reload animation
    if (isReloading) {
      ref.current.rotateX(Math.sin(Date.now() * 0.01) * 0.3);
    }
  });

  if (cameraMode !== "fpv") return null;

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.08, 0.4]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.06, 0.05]}>
        <boxGeometry args={[0.06, 0.12, 0.15]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Lock-on target indicator in 3D
function LockOnIndicator({ target, enemies }: { target: LockOnTarget; enemies: EnemyState[] }) {
  const ref = useRef<THREE.Group>(null);
  const enemy = enemies.find(e => e.id === target.enemyId);
  
  useFrame(() => {
    if (!ref.current || !enemy) return;
    ref.current.position.set(enemy.position.x, enemy.position.y + 2.2, enemy.position.z);
    ref.current.rotation.y += 0.03;
  });

  if (!enemy || enemy.isDead) return null;

  return (
    <group ref={ref}>
      {/* Diamond reticle */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.3, 0.4, 4]} />
        <meshBasicMaterial color="#ff2222" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <ringGeometry args={[0.3, 0.4, 4]} />
        <meshBasicMaterial color="#ff2222" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
      {/* Glow */}
      <pointLight color="#ff2222" intensity={2} distance={5} />
      <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ff4444" anchorX="center">
        🎯 LOCKED
      </Text>
    </group>
  );
}

// Voxel character with archetype indicators
function VoxelCharacter({
  position,
  rotation,
  color,
  isCrouching,
  isPlayer,
  hp,
  maxHp,
  isDead,
  name,
  emoji,
  hideInFPV,
  isLockedOn,
}: {
  position: { x: number; y: number; z: number };
  rotation: number;
  color: string;
  isCrouching: boolean;
  isPlayer?: boolean;
  hp: number;
  maxHp: number;
  isDead: boolean;
  name: string;
  emoji?: string;
  hideInFPV?: boolean;
  isLockedOn?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const walkPhase = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(
      new THREE.Vector3(position.x, position.y, position.z),
      0.2
    );
    const targetRot = new THREE.Euler(0, rotation, 0);
    groupRef.current.rotation.y += (targetRot.y - groupRef.current.rotation.y) * 0.15;

    const isMoving = Math.abs(position.x - groupRef.current.position.x) > 0.01 ||
                     Math.abs(position.z - groupRef.current.position.z) > 0.01;
    if (isMoving) {
      walkPhase.current += delta * 8;
      const swing = Math.sin(walkPhase.current) * 0.5;
      if (legLRef.current) legLRef.current.rotation.x = swing;
      if (legRRef.current) legRRef.current.rotation.x = -swing;
      if (armLRef.current) armLRef.current.rotation.x = -swing * 0.7;
      if (armRRef.current) armRRef.current.rotation.x = swing * 0.7;
    } else {
      if (legLRef.current) legLRef.current.rotation.x *= 0.9;
      if (legRRef.current) legRRef.current.rotation.x *= 0.9;
      if (armLRef.current) armLRef.current.rotation.x *= 0.9;
      if (armRRef.current) armRRef.current.rotation.x *= 0.9;
    }
  });

  if (isDead || hideInFPV) return null;

  const bodyH = isCrouching ? 0.4 : 0.6;
  const baseY = isCrouching ? -0.2 : 0;
  const lockedGlow = isLockedOn ? 1.5 : 0;

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, bodyH + 0.65 + baseY, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} emissive={isLockedOn ? "#ff0000" : "#000000"} emissiveIntensity={lockedGlow} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.12, bodyH + 0.7 + baseY, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.12, bodyH + 0.7 + baseY, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
      </mesh>

      {/* Body */}
      <mesh position={[0, bodyH * 0.5 + 0.15 + baseY, 0]} castShadow>
        <boxGeometry args={[0.5, bodyH, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} emissive={isLockedOn ? "#ff0000" : "#000000"} emissiveIntensity={lockedGlow * 0.5} />
      </mesh>

      {/* Arms */}
      <mesh ref={armLRef} position={[0.4, bodyH * 0.5 + 0.2 + baseY, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh ref={armRRef} position={[-0.4, bodyH * 0.5 + 0.2 + baseY, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>

      {/* Legs */}
      {!isCrouching && (
        <>
          <mesh ref={legLRef} position={[0.12, -0.15 + baseY, 0]} castShadow>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} roughness={0.7} />
          </mesh>
          <mesh ref={legRRef} position={[-0.12, -0.15 + baseY, 0]} castShadow>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* HP bar + name above head */}
      {!isPlayer && (
        <group position={[0, bodyH + 1.2 + baseY, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-(1 - hp / maxHp) * 0.5, 0, 0.001]}>
            <planeGeometry args={[(hp / maxHp) * 1, 0.08]} />
            <meshBasicMaterial color={hp / maxHp > 0.5 ? "#4caf50" : hp / maxHp > 0.25 ? "#ff9800" : "#f44336"} />
          </mesh>
          <Text position={[0, 0.15, 0]} fontSize={0.12} color="white" anchorX="center" anchorY="middle">
            {emoji ? `${emoji} ${name}` : name}
          </Text>
        </group>
      )}
    </group>
  );
}

// Projectile visuals with glow
function ProjectileMesh({ proj, eraId }: { proj: Projectile; eraId: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(proj.position.x, proj.position.y, proj.position.z);
    }
  });

  const config: Record<string, { color: string; size: number; intensity: number }> = {
    future: { color: "#00e5ff", size: 0.08, intensity: 4 },
    modern: { color: "#ffaa00", size: 0.06, intensity: 3 },
    medieval: { color: "#ff8800", size: 0.12, intensity: 2 },
    ancient: { color: "#8B4513", size: 0.12, intensity: 1 },
  };
  const c = config[eraId] || config.ancient;

  return (
    <group>
      <mesh ref={ref} position={[proj.position.x, proj.position.y, proj.position.z]}>
        <sphereGeometry args={[c.size, 8, 8]} />
        <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={c.intensity} />
      </mesh>
      <pointLight position={[proj.position.x, proj.position.y, proj.position.z]} color={c.color} intensity={0.5} distance={3} />
    </group>
  );
}

// Map blocks with enhanced materials
function MapBlockMesh({ block, eraId }: { block: MapBlock; eraId: string }) {
  const colors = ERA_COLORS[eraId as keyof typeof ERA_COLORS] || ERA_COLORS.ancient;
  const color = colors[block.color as keyof typeof colors] || "#888";

  return (
    <mesh position={[block.position.x, block.position.y, block.position.z]} receiveShadow castShadow>
      <boxGeometry args={[block.size.x, block.size.y, block.size.z]} />
      <meshStandardMaterial
        color={color}
        roughness={block.type === "ground" ? 0.9 : 0.6}
        metalness={block.type === "wall" ? 0.15 : block.type === "platform" ? 0.1 : 0}
      />
    </mesh>
  );
}

// HUD overlay
function GameHUD({
  player,
  weapon,
  killFeed,
  eraId,
  earnedCoins,
  nightVisionActive,
  nightVisionBattery,
  enemies,
  mapBlocks,
  cameraMode,
  lockOnTarget,
  onExit,
}: {
  player: PlayerState;
  weapon: { name: string; emoji: string; magSize: number };
  killFeed: string[];
  eraId: string;
  earnedCoins: number;
  nightVisionActive: boolean;
  nightVisionBattery: number;
  enemies: EnemyState[];
  mapBlocks: MapBlock[];
  cameraMode: CameraMode;
  lockOnTarget: LockOnTarget | null;
  onExit: () => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Crosshair */}
      {!player.isDead && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 relative">
            <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-white/80 -translate-x-1/2" />
            <div className="absolute left-1/2 bottom-0 w-0.5 h-2 bg-white/80 -translate-x-1/2" />
            <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-white/80 -translate-y-1/2" />
            <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-white/80 -translate-y-1/2" />
            <div className={`absolute left-1/2 top-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2 ${lockOnTarget ? "bg-red-500" : "bg-red-500/60"}`} />
          </div>
          {lockOnTarget && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-red-400 text-[10px] font-display whitespace-nowrap">
              🎯 LOCKED
            </div>
          )}
        </div>
      )}

      {/* HP Bar */}
      <div className="absolute bottom-6 left-6">
        <div className="font-display text-xs text-primary mb-1">HP</div>
        <div className="w-48 h-4 bg-muted rounded-full overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${(player.hp / player.maxHp) * 100}%`,
              background: player.hp > 60 ? "linear-gradient(90deg, #4caf50, #66bb6a)" : player.hp > 30 ? "linear-gradient(90deg, #ff9800, #ffc107)" : "linear-gradient(90deg, #f44336, #ff5722)",
            }}
          />
        </div>
        <div className="font-body text-xs text-foreground mt-0.5">{Math.round(player.hp)}/{player.maxHp}</div>

        {/* Night Vision Battery */}
        <div className="mt-2">
          <div className="font-display text-xs text-primary mb-0.5">🔋 NV {nightVisionActive ? "ON" : "OFF"}</div>
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden border border-border">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${nightVisionBattery}%`,
                background: nightVisionActive
                  ? "linear-gradient(90deg, #00e676, #76ff03)"
                  : "linear-gradient(90deg, #66bb6a, #a5d6a7)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Ammo */}
      <div className="absolute bottom-6 right-6 text-right">
        <div className="font-display text-xs text-primary mb-1">{weapon.emoji} {weapon.name}</div>
        <div className="font-display text-3xl text-foreground">
          {player.isReloading ? (
            <span className="text-accent animate-pulse">RELOADING...</span>
          ) : (
            <>{player.ammo}<span className="text-muted-foreground text-lg"> / {weapon.magSize}</span></>
          )}
        </div>
      </div>

      {/* Kill/Death + Coins + Camera Mode */}
      <div className="absolute top-4 right-6 font-body text-sm flex items-center gap-4">
        <span className="text-muted-foreground text-xs border border-border rounded px-1.5 py-0.5">
          {cameraMode === "fpv" ? "👁 FPV" : "🎥 TPV"} [V]
        </span>
        <span className="text-primary">🪙 {earnedCoins}</span>
        <span className="text-green-400">K: {player.kills}</span>
        <span className="text-red-400">D: {player.deaths}</span>
      </div>

      {/* Kill feed */}
      <div className="absolute top-12 right-6 space-y-1">
        {killFeed.map((msg, i) => (
          <div key={i} className="font-body text-xs text-foreground bg-background/60 px-2 py-0.5 rounded" style={{ opacity: 1 - i * 0.2 }}>
            {msg}
          </div>
        ))}
      </div>

      {/* Death screen */}
      {player.isDead && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70">
          <h2 className="font-display font-black text-5xl text-red-500 mb-2">💀 ELIMINATED</h2>
          <p className="font-body text-muted-foreground mb-4">Respawning...</p>
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${player.reloadProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* Exit button */}
      <button onClick={onExit} className="absolute top-4 left-4 pointer-events-auto btn-attack text-xs px-3 py-1.5">
        ✕ Exit
      </button>

      {/* Controls hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-body text-xs text-muted-foreground animate-pulse">
        WASD move • Space jump • C crouch • Shift run • R reload • N night vision • V camera • Q lock-on • Scroll switch target
      </div>

      {/* Minimap */}
      <Minimap player={player} enemies={enemies} mapBlocks={mapBlocks} />
    </div>
  );
}

// Main 3D Arena
const CombatArena3D = ({ era, player: fighterData, economy, onEnd }: CombatArena3DProps) => {
  const {
    player,
    enemies,
    projectiles,
    damageFlash,
    killFeed,
    weapon,
    mapBlocks,
    mouseRotRef,
    earnedCoins,
    cameraMode,
    lockOnTarget,
  } = use3DGameEngine(era.id, economy);

  const { active: nvActive, battery: nvBattery } = useNightVision();

  const eraId = era.id;
  const colors = ERA_COLORS[eraId as keyof typeof ERA_COLORS] || ERA_COLORS.ancient;
  const isFuture = eraId === "future";
  const isModern = eraId === "modern";

  // Detect if player is moving
  const prevPos = useRef(player.position);
  const isMoving = Math.abs(player.position.x - prevPos.current.x) > 0.01 ||
                   Math.abs(player.position.z - prevPos.current.z) > 0.01;
  prevPos.current = player.position;

  const handleExit = useCallback(() => {
    document.exitPointerLock();
    onEnd(player.kills > player.deaths, earnedCoins);
  }, [onEnd, player.kills, player.deaths, earnedCoins]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {damageFlash && (
        <div className="absolute inset-0 z-30 pointer-events-none bg-red-500/30" />
      )}

      <GameHUD
        player={player} weapon={weapon} killFeed={killFeed} eraId={eraId}
        earnedCoins={earnedCoins} nightVisionActive={nvActive} nightVisionBattery={nvBattery}
        enemies={enemies} mapBlocks={mapBlocks} cameraMode={cameraMode}
        lockOnTarget={lockOnTarget} onExit={handleExit}
      />

      <NightVision active={nvActive}>
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 200 }}
          style={{ background: colors.sky }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        >
        {/* Enhanced lighting */}
        <ambientLight intensity={isFuture ? 0.2 : isModern ? 0.4 : 0.5} color={colors.ambient} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={isFuture ? 0.4 : isModern ? 1.0 : 1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-bias={-0.001}
        />
        {isFuture && (
          <>
            <pointLight position={[0, 12, 0]} color="#00bcd4" intensity={3} distance={40} />
            <pointLight position={[-15, 5, -15]} color="#e91e63" intensity={1.5} distance={20} />
            <pointLight position={[15, 5, 15]} color="#7c4dff" intensity={1.5} distance={20} />
          </>
        )}
        {isModern && <hemisphereLight color="#87ceeb" groundColor="#3a5f0b" intensity={0.3} />}

        {isFuture ? (
          <Stars radius={100} depth={50} count={3000} factor={3} fade speed={1} />
        ) : (
          <Sky
            sunPosition={isModern ? [50, 30, 50] : [100, 20, 100]}
            turbidity={eraId === "ancient" ? 2 : isModern ? 4 : 8}
            rayleigh={isModern ? 1.5 : 1}
          />
        )}

        <CameraController
          playerPos={player.position}
          mouseRotRef={mouseRotRef}
          isDead={player.isDead}
          cameraMode={cameraMode}
          isMoving={isMoving}
          isRunning={player.isRunning}
          lockOnTarget={lockOnTarget}
          mapBlocks={mapBlocks}
        />

        {/* FPS Weapon */}
        <FPSWeapon cameraMode={cameraMode} weapon={weapon} isReloading={player.isReloading} />

        {/* Lock-on indicator */}
        {lockOnTarget && <LockOnIndicator target={lockOnTarget} enemies={enemies} />}

        {/* Map blocks */}
        {mapBlocks.map((block, i) => (
          <MapBlockMesh key={i} block={block} eraId={eraId} />
        ))}

        {/* Player - hidden in FPV */}
        <VoxelCharacter
          position={player.position}
          rotation={player.rotation}
          color={fighterData.color}
          isCrouching={player.isCrouching}
          isPlayer
          hp={player.hp}
          maxHp={player.maxHp}
          isDead={player.isDead}
          name={fighterData.name}
          hideInFPV={cameraMode === "fpv"}
        />

        {/* Enemies with lock-on glow */}
        {enemies.map((e) => (
          <VoxelCharacter
            key={e.id}
            position={e.position}
            rotation={e.rotation}
            color={e.color}
            isCrouching={false}
            hp={e.hp}
            maxHp={e.maxHp}
            isDead={e.isDead}
            name={`${e.archetypeName} ${e.id + 1}`}
            emoji={e.archetypeEmoji}
            isLockedOn={lockOnTarget?.enemyId === e.id}
          />
        ))}

        {/* Projectiles */}
        {projectiles.map((p) => (
          <ProjectileMesh key={p.id} proj={p} eraId={eraId} />
        ))}

        <fog attach="fog" color={colors.sky} near={isFuture ? 20 : 35} far={isFuture ? 45 : 90} />
      </Canvas>
      </NightVision>
    </div>
  );
};

export default CombatArena3D;
