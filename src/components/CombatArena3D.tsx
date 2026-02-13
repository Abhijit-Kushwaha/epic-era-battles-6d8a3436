import { useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Text, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Era, Fighter } from "@/game/gameData";
import { use3DGameEngine } from "@/game/use3DGameEngine";
import { ERA_COLORS } from "@/game/mapData";
import { MapBlock, EnemyState, Projectile, PlayerState } from "@/game/types3d";
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

// Camera controller
function CameraController({
  playerPos,
  mouseRotRef,
  isDead,
}: {
  playerPos: { x: number; y: number; z: number };
  mouseRotRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  isDead: boolean;
}) {
  const { camera, gl } = useThree();
  const isLocked = useRef(false);

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

  useFrame(() => {
    const { yaw, pitch } = mouseRotRef.current;
    const dist = isDead ? 8 : 5;
    const height = isDead ? 4 : 2.5;

    const camX = playerPos.x - Math.sin(yaw) * Math.cos(pitch) * dist;
    const camY = playerPos.y + height - Math.sin(pitch) * dist * 0.3;
    const camZ = playerPos.z - Math.cos(yaw) * Math.cos(pitch) * dist;

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
    camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
  });

  return null;
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

  if (isDead) return null;

  const bodyH = isCrouching ? 0.4 : 0.6;
  const baseY = isCrouching ? -0.2 : 0;

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, bodyH + 0.65 + baseY, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
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
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
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
      {/* Point light for glow effect */}
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
            <div className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-red-500/60 -translate-x-1/2 -translate-y-1/2" />
          </div>
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

      {/* Kill/Death + Coins */}
      <div className="absolute top-4 right-6 font-body text-sm flex items-center gap-4">
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
        Click to lock mouse • WASD move • Space jump • C crouch • Shift run • R reload • N night vision • Mouse shoot
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
  } = use3DGameEngine(era.id, economy);

  const { active: nvActive, battery: nvBattery } = useNightVision();

  const eraId = era.id;
  const colors = ERA_COLORS[eraId as keyof typeof ERA_COLORS] || ERA_COLORS.ancient;
  const isFuture = eraId === "future";
  const isModern = eraId === "modern";

  const handleExit = useCallback(() => {
    document.exitPointerLock();
    onEnd(player.kills > player.deaths, earnedCoins);
  }, [onEnd, player.kills, player.deaths, earnedCoins]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {damageFlash && (
        <div className="absolute inset-0 z-30 pointer-events-none bg-red-500/30" />
      )}

      <GameHUD player={player} weapon={weapon} killFeed={killFeed} eraId={eraId} earnedCoins={earnedCoins} nightVisionActive={nvActive} nightVisionBattery={nvBattery} enemies={enemies} mapBlocks={mapBlocks} onExit={handleExit} />

      <NightVision active={nvActive}>
        <Canvas
          shadows
          camera={{ fov: 70, near: 0.1, far: 200 }}
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
        {/* Era-specific accent lights */}
        {isFuture && (
          <>
            <pointLight position={[0, 12, 0]} color="#00bcd4" intensity={3} distance={40} />
            <pointLight position={[-15, 5, -15]} color="#e91e63" intensity={1.5} distance={20} />
            <pointLight position={[15, 5, 15]} color="#7c4dff" intensity={1.5} distance={20} />
          </>
        )}
        {isModern && <hemisphereLight color="#87ceeb" groundColor="#3a5f0b" intensity={0.3} />}

        {/* Sky & atmosphere */}
        {isFuture ? (
          <Stars radius={100} depth={50} count={3000} factor={3} fade speed={1} />
        ) : (
          <Sky
            sunPosition={isModern ? [50, 30, 50] : [100, 20, 100]}
            turbidity={eraId === "ancient" ? 2 : isModern ? 4 : 8}
            rayleigh={isModern ? 1.5 : 1}
          />
        )}

        <CameraController playerPos={player.position} mouseRotRef={mouseRotRef} isDead={player.isDead} />

        {/* Map blocks */}
        {mapBlocks.map((block, i) => (
          <MapBlockMesh key={i} block={block} eraId={eraId} />
        ))}

        {/* Player */}
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
        />

        {/* Enemies with archetype info */}
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
          />
        ))}

        {/* Projectiles */}
        {projectiles.map((p) => (
          <ProjectileMesh key={p.id} proj={p} eraId={eraId} />
        ))}

        {/* Enhanced fog */}
        <fog attach="fog" color={colors.sky} near={isFuture ? 20 : 35} far={isFuture ? 45 : 90} />
      </Canvas>
      </NightVision>
    </div>
  );
};

export default CombatArena3D;
