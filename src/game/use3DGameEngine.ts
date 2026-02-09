import { useRef, useCallback, useState, useEffect } from "react";
import { PlayerState, EnemyState, Projectile, Weapon, ERA_WEAPONS, Vec3 } from "./types3d";
import { generateMap, SPAWN_POINTS, PLAYER_SPAWN } from "./mapData";

const GRAVITY = -20;
const JUMP_FORCE = 8;
const MOVE_SPEED = 8;
const RUN_MULTIPLIER = 1.5;
const CROUCH_MULTIPLIER = 0.5;
const PLAYER_HEIGHT = 1.8;
const CROUCH_HEIGHT = 1.0;
const ENEMY_COUNT = 5;
const RESPAWN_TIME = 3;
const MAP_BOUNDS = 19;

interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
  reload: boolean;
  crouch: boolean;
  run: boolean;
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function dist3d(a: Vec3, b: Vec3) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function createEnemy(id: number, spawn: Vec3): EnemyState {
  return {
    id,
    position: { ...spawn },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: Math.random() * Math.PI * 2,
    hp: 100,
    maxHp: 100,
    isDead: false,
    respawnTimer: 0,
    aiState: "patrol",
    targetPoint: { x: (Math.random() - 0.5) * 30, y: 0.5, z: (Math.random() - 0.5) * 30 },
    lastFireTime: 0,
    ammo: 10,
  };
}

export function use3DGameEngine(eraId: string) {
  const weapon = ERA_WEAPONS[eraId] || ERA_WEAPONS.ancient;
  const mapBlocks = useRef(generateMap());

  const [player, setPlayer] = useState<PlayerState>(() => ({
    position: { ...PLAYER_SPAWN },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: 0,
    hp: 100,
    maxHp: 100,
    ammo: weapon.magSize,
    maxAmmo: weapon.magSize,
    isReloading: false,
    reloadProgress: 0,
    isCrouching: false,
    isRunning: false,
    isGrounded: true,
    isDead: false,
    kills: 0,
    deaths: 0,
    lastFireTime: 0,
  }));

  const [enemies, setEnemies] = useState<EnemyState[]>(() =>
    SPAWN_POINTS.slice(0, ENEMY_COUNT).map((sp, i) => createEnemy(i, sp))
  );

  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const [killFeed, setKillFeed] = useState<string[]>([]);

  const keysRef = useRef<Keys>({
    forward: false, backward: false, left: false, right: false,
    jump: false, fire: false, reload: false, crouch: false, run: false,
  });
  const mouseRotRef = useRef({ yaw: 0, pitch: 0 });
  const projectileIdRef = useRef(0);
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const projectilesRef = useRef(projectiles);
  playerRef.current = player;
  enemiesRef.current = enemies;
  projectilesRef.current = projectiles;

  // Input handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.code) {
        case "KeyW": case "ArrowUp": k.forward = true; break;
        case "KeyS": case "ArrowDown": k.backward = true; break;
        case "KeyA": case "ArrowLeft": k.left = true; break;
        case "KeyD": case "ArrowRight": k.right = true; break;
        case "Space": k.jump = true; e.preventDefault(); break;
        case "KeyR": k.reload = true; break;
        case "KeyC": case "ControlLeft": k.crouch = true; break;
        case "ShiftLeft": k.run = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.code) {
        case "KeyW": case "ArrowUp": k.forward = false; break;
        case "KeyS": case "ArrowDown": k.backward = false; break;
        case "KeyA": case "ArrowLeft": k.left = false; break;
        case "KeyD": case "ArrowRight": k.right = false; break;
        case "Space": k.jump = false; break;
        case "KeyR": k.reload = false; break;
        case "KeyC": case "ControlLeft": k.crouch = false; break;
        case "ShiftLeft": k.run = false; break;
      }
    };
    const onMouseDown = () => { keysRef.current.fire = true; };
    const onMouseUp = () => { keysRef.current.fire = false; };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const addKillFeed = useCallback((msg: string) => {
    setKillFeed(prev => [msg, ...prev].slice(0, 5));
  }, []);

  // Main game loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const keys = keysRef.current;
      const p = { ...playerRef.current };
      const ens = enemiesRef.current.map(e => ({ ...e, position: { ...e.position }, velocity: { ...e.velocity }, targetPoint: { ...e.targetPoint } }));
      let projs = projectilesRef.current.map(pr => ({ ...pr, position: { ...pr.position }, velocity: { ...pr.velocity } }));

      if (!p.isDead) {
        // Player movement
        const yaw = mouseRotRef.current.yaw;
        let speed = MOVE_SPEED;
        p.isCrouching = keys.crouch;
        p.isRunning = keys.run && !keys.crouch;
        if (p.isCrouching) speed *= CROUCH_MULTIPLIER;
        if (p.isRunning) speed *= RUN_MULTIPLIER;

        let moveX = 0, moveZ = 0;
        if (keys.forward) { moveX += Math.sin(yaw); moveZ += Math.cos(yaw); }
        if (keys.backward) { moveX -= Math.sin(yaw); moveZ -= Math.cos(yaw); }
        if (keys.left) { moveX += Math.sin(yaw + Math.PI / 2); moveZ += Math.cos(yaw + Math.PI / 2); }
        if (keys.right) { moveX -= Math.sin(yaw + Math.PI / 2); moveZ -= Math.cos(yaw + Math.PI / 2); }

        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (len > 0) { moveX /= len; moveZ /= len; }

        p.velocity.x = moveX * speed;
        p.velocity.z = moveZ * speed;

        // Jump
        if (keys.jump && p.isGrounded) {
          p.velocity.y = JUMP_FORCE;
          p.isGrounded = false;
        }

        // Gravity
        p.velocity.y += GRAVITY * dt;

        // Apply velocity
        p.position.x += p.velocity.x * dt;
        p.position.y += p.velocity.y * dt;
        p.position.z += p.velocity.z * dt;

        // Ground collision
        if (p.position.y <= 0.5) {
          p.position.y = 0.5;
          p.velocity.y = 0;
          p.isGrounded = true;
        }

        // Map bounds
        p.position.x = clamp(p.position.x, -MAP_BOUNDS, MAP_BOUNDS);
        p.position.z = clamp(p.position.z, -MAP_BOUNDS, MAP_BOUNDS);

        // Simple block collision
        for (const block of mapBlocks.current) {
          if (block.type === "ground") continue;
          const bx = block.position.x, bz = block.position.z;
          const hw = block.size.x / 2, hd = block.size.z / 2;
          const bTop = block.position.y + block.size.y / 2;

          if (p.position.x > bx - hw - 0.3 && p.position.x < bx + hw + 0.3 &&
              p.position.z > bz - hd - 0.3 && p.position.z < bz + hd + 0.3) {
            // On top of block
            if (p.position.y >= bTop - 0.3 && p.velocity.y <= 0) {
              p.position.y = bTop + 0.5;
              p.velocity.y = 0;
              p.isGrounded = true;
            } else if (p.position.y < bTop - 0.3) {
              // Push out horizontally
              const dx = p.position.x - bx;
              const dz = p.position.z - bz;
              if (Math.abs(dx) / hw > Math.abs(dz) / hd) {
                p.position.x = dx > 0 ? bx + hw + 0.3 : bx - hw - 0.3;
              } else {
                p.position.z = dz > 0 ? bz + hd + 0.3 : bz - hd - 0.3;
              }
            }
          }
        }

        p.rotation = yaw;

        // Reloading
        if (p.isReloading) {
          p.reloadProgress += dt / weapon.reloadTime;
          if (p.reloadProgress >= 1) {
            p.ammo = weapon.magSize;
            p.isReloading = false;
            p.reloadProgress = 0;
          }
        }

        if (keys.reload && !p.isReloading && p.ammo < weapon.magSize) {
          p.isReloading = true;
          p.reloadProgress = 0;
        }

        // Firing
        const fireInterval = 1 / weapon.fireRate;
        if (keys.fire && !p.isReloading && p.ammo > 0 && now / 1000 - p.lastFireTime > fireInterval) {
          p.lastFireTime = now / 1000;
          p.ammo--;

          const pitch = mouseRotRef.current.pitch;
          const dir: Vec3 = {
            x: Math.sin(yaw) * Math.cos(pitch),
            y: Math.sin(pitch),
            z: Math.cos(yaw) * Math.cos(pitch),
          };

          projs.push({
            id: projectileIdRef.current++,
            position: { x: p.position.x, y: p.position.y + 1, z: p.position.z },
            velocity: { x: dir.x * weapon.projectileSpeed, y: dir.y * weapon.projectileSpeed, z: dir.z * weapon.projectileSpeed },
            damage: weapon.damage,
            ownerId: "player",
            lifetime: 3,
          });

          if (p.ammo <= 0) {
            p.isReloading = true;
            p.reloadProgress = 0;
          }
        }
      } else {
        // Dead - respawn timer
        p.reloadProgress += dt / RESPAWN_TIME;
        if (p.reloadProgress >= 1) {
          p.isDead = false;
          p.hp = p.maxHp;
          p.ammo = weapon.magSize;
          p.isReloading = false;
          p.reloadProgress = 0;
          p.position = { ...PLAYER_SPAWN };
          p.velocity = { x: 0, y: 0, z: 0 };
        }
      }

      // Update enemies
      for (const e of ens) {
        if (e.isDead) {
          e.respawnTimer -= dt;
          if (e.respawnTimer <= 0) {
            const sp = SPAWN_POINTS[e.id % SPAWN_POINTS.length];
            e.position = { ...sp };
            e.hp = e.maxHp;
            e.isDead = false;
            e.aiState = "patrol";
            e.ammo = 10;
          }
          continue;
        }

        const distToPlayer = dist3d(e.position, p.position);

        // AI state machine
        if (p.isDead) {
          e.aiState = "patrol";
        } else if (distToPlayer < 6) {
          e.aiState = "attack";
        } else if (distToPlayer < 20) {
          e.aiState = "chase";
        } else {
          e.aiState = "patrol";
        }

        const eSpeed = 4;
        switch (e.aiState) {
          case "patrol": {
            const toTarget = { x: e.targetPoint.x - e.position.x, z: e.targetPoint.z - e.position.z };
            const tDist = Math.sqrt(toTarget.x ** 2 + toTarget.z ** 2);
            if (tDist < 1) {
              e.targetPoint = { x: (Math.random() - 0.5) * 30, y: 0.5, z: (Math.random() - 0.5) * 30 };
            } else {
              e.velocity.x = (toTarget.x / tDist) * eSpeed * 0.5;
              e.velocity.z = (toTarget.z / tDist) * eSpeed * 0.5;
              e.rotation = Math.atan2(toTarget.x, toTarget.z);
            }
            break;
          }
          case "chase": {
            const toPlayer = { x: p.position.x - e.position.x, z: p.position.z - e.position.z };
            const cDist = Math.sqrt(toPlayer.x ** 2 + toPlayer.z ** 2);
            if (cDist > 0.5) {
              e.velocity.x = (toPlayer.x / cDist) * eSpeed;
              e.velocity.z = (toPlayer.z / cDist) * eSpeed;
            }
            e.rotation = Math.atan2(toPlayer.x, toPlayer.z);
            break;
          }
          case "attack": {
            const toPlayer = { x: p.position.x - e.position.x, z: p.position.z - e.position.z };
            const aDist = Math.sqrt(toPlayer.x ** 2 + toPlayer.z ** 2);
            e.rotation = Math.atan2(toPlayer.x, toPlayer.z);
            e.velocity.x = 0;
            e.velocity.z = 0;

            // Strafe
            if (Math.random() < 0.02) {
              const strafe = Math.random() > 0.5 ? 1 : -1;
              e.velocity.x = Math.sin(e.rotation + Math.PI / 2) * eSpeed * 0.5 * strafe;
              e.velocity.z = Math.cos(e.rotation + Math.PI / 2) * eSpeed * 0.5 * strafe;
            }

            // Shoot
            if (now / 1000 - e.lastFireTime > 1.5 && e.ammo > 0) {
              e.lastFireTime = now / 1000;
              e.ammo--;
              if (aDist > 0) {
                const dir = { x: toPlayer.x / aDist, y: (p.position.y + 0.8 - e.position.y - 0.8) / aDist, z: toPlayer.z / aDist };
                // Add inaccuracy
                const acc = 0.15;
                projs.push({
                  id: projectileIdRef.current++,
                  position: { x: e.position.x, y: e.position.y + 1, z: e.position.z },
                  velocity: {
                    x: (dir.x + (Math.random() - 0.5) * acc) * 20,
                    y: (dir.y + (Math.random() - 0.5) * acc) * 20,
                    z: (dir.z + (Math.random() - 0.5) * acc) * 20,
                  },
                  damage: 10,
                  ownerId: e.id,
                  lifetime: 3,
                });
              }
              if (e.ammo <= 0) {
                setTimeout(() => {
                  setEnemies(prev => prev.map(en => en.id === e.id ? { ...en, ammo: 10 } : en));
                }, 2000);
              }
            }
            break;
          }
        }

        // Apply physics
        e.velocity.y += GRAVITY * dt;
        e.position.x += e.velocity.x * dt;
        e.position.y += e.velocity.y * dt;
        e.position.z += e.velocity.z * dt;
        if (e.position.y <= 0.5) { e.position.y = 0.5; e.velocity.y = 0; }
        e.position.x = clamp(e.position.x, -MAP_BOUNDS, MAP_BOUNDS);
        e.position.z = clamp(e.position.z, -MAP_BOUNDS, MAP_BOUNDS);
      }

      // Update projectiles
      const newProjs: Projectile[] = [];
      for (const pr of projs) {
        pr.position.x += pr.velocity.x * dt;
        pr.position.y += pr.velocity.y * dt;
        pr.position.z += pr.velocity.z * dt;
        pr.lifetime -= dt;

        if (pr.lifetime <= 0 || pr.position.y < 0 || Math.abs(pr.position.x) > MAP_BOUNDS + 2 || Math.abs(pr.position.z) > MAP_BOUNDS + 2) {
          continue;
        }

        // Hit detection
        let hit = false;

        if (pr.ownerId === "player") {
          // Check enemy hits
          for (const e of ens) {
            if (e.isDead) continue;
            if (dist3d(pr.position, { x: e.position.x, y: e.position.y + 0.8, z: e.position.z }) < 1) {
              e.hp -= pr.damage;
              if (e.hp <= 0) {
                e.isDead = true;
                e.respawnTimer = RESPAWN_TIME;
                p.kills++;
                addKillFeed(`You eliminated Bot ${e.id + 1}`);
              }
              hit = true;
              break;
            }
          }
        } else {
          // Check player hit
          if (!p.isDead && dist3d(pr.position, { x: p.position.x, y: p.position.y + 0.8, z: p.position.z }) < 0.8) {
            p.hp -= pr.damage;
            setDamageFlash(true);
            setTimeout(() => setDamageFlash(false), 150);
            if (p.hp <= 0) {
              p.isDead = true;
              p.deaths++;
              p.reloadProgress = 0;
              addKillFeed(`Bot ${(pr.ownerId as number) + 1} eliminated you`);
            }
            hit = true;
          }
        }

        // Block collision
        if (!hit) {
          for (const block of mapBlocks.current) {
            if (block.type === "ground") continue;
            const bx = block.position.x, by = block.position.y, bz = block.position.z;
            const hw = block.size.x / 2, hh = block.size.y / 2, hd = block.size.z / 2;
            if (pr.position.x > bx - hw && pr.position.x < bx + hw &&
                pr.position.y > by - hh && pr.position.y < by + hh &&
                pr.position.z > bz - hd && pr.position.z < bz + hd) {
              hit = true;
              break;
            }
          }
        }

        if (!hit) newProjs.push(pr);
      }

      setPlayer(p);
      setEnemies(ens);
      setProjectiles(newProjs);

      animRef.current = requestAnimationFrame(loop);
    };

    const animRef = { current: requestAnimationFrame(loop) };
    return () => cancelAnimationFrame(animRef.current);
  }, [weapon, addKillFeed]);

  return {
    player,
    enemies,
    projectiles,
    damageFlash,
    killFeed,
    weapon,
    mapBlocks: mapBlocks.current,
    mouseRotRef,
    keysRef,
  };
}
