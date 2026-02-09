import { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Text } from "@react-three/drei";
import * as THREE from "three";
import { Era, Fighter } from "@/game/gameData";
import { use3DGameEngine } from "@/game/use3DGameEngine";
import { ERA_COLORS } from "@/game/mapData";
import { MapBlock, EnemyState, Projectile, PlayerState } from "@/game/types3d";

interface CombatArena3DProps {
  era: Era;
  player: Fighter;
  onEnd: (won: boolean) => void;
}

// Camera controller: third-person following player
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

// Voxel-style player character
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
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
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
    // Smooth rotation
    const targetRot = new THREE.Euler(0, rotation, 0);
    groupRef.current.rotation.y += (targetRot.y - groupRef.current.rotation.y) * 0.15;

    // Walking animation
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
      <mesh ref={headRef} position={[0, bodyH + 0.65 + baseY, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.12, bodyH + 0.7 + baseY, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.12, bodyH + 0.7 + baseY, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Body */}
      <mesh position={[0, bodyH * 0.5 + 0.15 + baseY, 0]}>
        <boxGeometry args={[0.5, bodyH, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Arms */}
      <mesh ref={armLRef} position={[0.4, bodyH * 0.5 + 0.2 + baseY, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh ref={armRRef} position={[-0.4, bodyH * 0.5 + 0.2 + baseY, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>

      {/* Legs */}
      {!isCrouching && (
        <>
          <mesh ref={legLRef} position={[0.12, -0.15 + baseY, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} />
          </mesh>
          <mesh ref={legRRef} position={[-0.12, -0.15 + baseY, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} />
          </mesh>
        </>
      )}

      {/* HP bar above head */}
      {!isPlayer && (
        <group position={[0, bodyH + 1.2 + baseY, 0]}>
          {/* Background */}
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          {/* Fill */}
          <mesh position={[-(1 - hp / maxHp) * 0.5, 0, 0.001]}>
            <planeGeometry args={[(hp / maxHp) * 1, 0.08]} />
            <meshBasicMaterial color={hp / maxHp > 0.5 ? "#4caf50" : hp / maxHp > 0.25 ? "#ff9800" : "#f44336"} />
          </mesh>
          <Text position={[0, 0.15, 0]} fontSize={0.15} color="white" anchorX="center" anchorY="middle">
            {name}
          </Text>
        </group>
      )}
    </group>
  );
}

// Projectile visuals
function ProjectileMesh({ proj, eraId }: { proj: Projectile; eraId: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(proj.position.x, proj.position.y, proj.position.z);
    }
  });

  const color = eraId === "future" ? "#00e5ff" : eraId === "medieval" ? "#ff8800" : "#8B4513";
  const size = eraId === "future" ? 0.08 : 0.12;

  return (
    <mesh ref={ref} position={[proj.position.x, proj.position.y, proj.position.z]}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

// Map blocks
function MapBlockMesh({ block, eraId }: { block: MapBlock; eraId: string }) {
  const colors = ERA_COLORS[eraId as keyof typeof ERA_COLORS] || ERA_COLORS.ancient;
  const color = colors[block.color as keyof typeof colors] || "#888";

  return (
    <mesh position={[block.position.x, block.position.y, block.position.z]}>
      <boxGeometry args={[block.size.x, block.size.y, block.size.z]} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        metalness={block.type === "wall" ? 0.2 : 0}
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
  onExit,
}: {
  player: PlayerState;
  weapon: { name: string; emoji: string; magSize: number };
  killFeed: string[];
  eraId: string;
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
          </div>
        </div>
      )}

      {/* HP Bar */}
      <div className="absolute bottom-6 left-6">
        <div className="font-display text-xs text-primary mb-1">HP</div>
        <div className="w-48 h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${(player.hp / player.maxHp) * 100}%`,
              background: player.hp > 60 ? "linear-gradient(90deg, #4caf50, #66bb6a)" : player.hp > 30 ? "linear-gradient(90deg, #ff9800, #ffc107)" : "linear-gradient(90deg, #f44336, #ff5722)",
            }}
          />
        </div>
        <div className="font-body text-xs text-foreground mt-0.5">{player.hp}/{player.maxHp}</div>
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

      {/* Kill/Death counter */}
      <div className="absolute top-4 right-6 font-body text-sm">
        <span className="text-green-400 mr-3">K: {player.kills}</span>
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
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${player.reloadProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-4 left-4 pointer-events-auto btn-attack text-xs px-3 py-1.5"
      >
        ✕ Exit
      </button>

      {/* Click to play prompt */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-body text-xs text-muted-foreground animate-pulse">
        Click to lock mouse • WASD move • Space jump • C crouch • Shift run • R reload • Mouse shoot
      </div>
    </div>
  );
}

// Main 3D Arena
const CombatArena3D = ({ era, player: fighterData, onEnd }: CombatArena3DProps) => {
  const {
    player,
    enemies,
    projectiles,
    damageFlash,
    killFeed,
    weapon,
    mapBlocks,
    mouseRotRef,
  } = use3DGameEngine(era.id);

  const eraId = era.id;
  const colors = ERA_COLORS[eraId as keyof typeof ERA_COLORS] || ERA_COLORS.ancient;
  const isFuture = eraId === "future";

  const handleExit = useCallback(() => {
    document.exitPointerLock();
    onEnd(player.kills > player.deaths);
  }, [onEnd, player.kills, player.deaths]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Damage flash overlay */}
      {damageFlash && (
        <div className="absolute inset-0 z-30 pointer-events-none bg-red-500/30" />
      )}

      <GameHUD player={player} weapon={weapon} killFeed={killFeed} eraId={eraId} onExit={handleExit} />

      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 200 }}
        style={{ background: colors.sky }}
      >
        {/* Lighting */}
        <ambientLight intensity={isFuture ? 0.3 : 0.5} color={colors.ambient} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={isFuture ? 0.5 : 1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={80}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        {isFuture && <pointLight position={[0, 10, 0]} color="#00bcd4" intensity={2} distance={30} />}

        {/* Sky */}
        {!isFuture && <Sky sunPosition={[100, 20, 100]} turbidity={eraId === "ancient" ? 2 : 8} />}

        {/* Camera controller */}
        <CameraController playerPos={player.position} mouseRotRef={mouseRotRef} isDead={player.isDead} />

        {/* Map blocks */}
        {mapBlocks.map((block, i) => (
          <MapBlockMesh key={i} block={block} eraId={eraId} />
        ))}

        {/* Player character */}
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

        {/* Enemies */}
        {enemies.map((e) => (
          <VoxelCharacter
            key={e.id}
            position={e.position}
            rotation={e.rotation}
            color={eraId === "future" ? "#e91e63" : eraId === "medieval" ? "#8b0000" : "#b8860b"}
            isCrouching={false}
            hp={e.hp}
            maxHp={e.maxHp}
            isDead={e.isDead}
            name={`Bot ${e.id + 1}`}
          />
        ))}

        {/* Projectiles */}
        {projectiles.map((p) => (
          <ProjectileMesh key={p.id} proj={p} eraId={eraId} />
        ))}

        {/* Fog for atmosphere */}
        <fog attach="fog" color={colors.sky} near={30} far={isFuture ? 50 : 80} />
      </Canvas>
    </div>
  );
};

export default CombatArena3D;
