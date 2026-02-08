import { useEffect, useRef, useCallback, useState } from "react";
import { Fighter } from "@/game/gameData";

export interface GamePlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: "left" | "right";
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  isSpecial: boolean;
  isBlocking: boolean;
  isJumping: boolean;
  isHit: boolean;
  attackCooldown: number;
  specialCooldown: number;
  specialChargeMax: number;
  specialCharge: number;
  fighter: Fighter;
  attackFrame: number;
}

interface Keys {
  left: boolean;
  right: boolean;
  up: boolean;
  attack: boolean;
  special: boolean;
  block: boolean;
}

const GROUND_Y = 300;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED_BASE = 4;
const ARENA_WIDTH = 800;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 80;
const ATTACK_RANGE = 80;
const ATTACK_COOLDOWN = 20;
const SPECIAL_CHARGE_NEEDED = 100;
const FRAME_RATE = 1000 / 60;

function createPlayer(fighter: Fighter, x: number, facing: "left" | "right"): GamePlayer {
  return {
    x,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing,
    hp: fighter.hp,
    maxHp: fighter.maxHp,
    isAttacking: false,
    isSpecial: false,
    isBlocking: false,
    isJumping: false,
    isHit: false,
    attackCooldown: 0,
    specialCooldown: 0,
    specialChargeMax: SPECIAL_CHARGE_NEEDED,
    specialCharge: 0,
    fighter,
    attackFrame: 0,
  };
}

export function useGameEngine(playerFighter: Fighter, enemyFighter: Fighter) {
  const [player, setPlayer] = useState<GamePlayer>(() =>
    createPlayer(playerFighter, 150, "right")
  );
  const [enemy, setEnemy] = useState<GamePlayer>(() =>
    createPlayer(enemyFighter, 600, "left")
  );
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "enemy" | null>(null);
  const [combo, setCombo] = useState(0);
  const [hitEffects, setHitEffects] = useState<Array<{ id: number; x: number; y: number; damage: number }>>([]);

  const keysRef = useRef<Keys>({ left: false, right: false, up: false, attack: false, special: false, block: false });
  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const gameOverRef = useRef(false);
  const hitEffectId = useRef(0);

  playerRef.current = player;
  enemyRef.current = enemy;
  gameOverRef.current = gameOver;

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const k = keysRef.current;
      switch (e.key.toLowerCase()) {
        case "a": case "arrowleft": k.left = true; break;
        case "d": case "arrowright": k.right = true; break;
        case "w": case "arrowup": case " ": k.up = true; break;
        case "j": k.attack = true; break;
        case "k": k.special = true; break;
        case "s": case "arrowdown": k.block = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.key.toLowerCase()) {
        case "a": case "arrowleft": k.left = false; break;
        case "d": case "arrowright": k.right = false; break;
        case "w": case "arrowup": case " ": k.up = false; break;
        case "j": k.attack = false; break;
        case "k": k.special = false; break;
        case "s": case "arrowdown": k.block = false; break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const addHitEffect = useCallback((x: number, y: number, damage: number) => {
    const id = hitEffectId.current++;
    setHitEffects(prev => [...prev, { id, x, y, damage }]);
    setTimeout(() => {
      setHitEffects(prev => prev.filter(e => e.id !== id));
    }, 600);
  }, []);

  // Game loop
  useEffect(() => {
    let aiTimer = 0;
    let aiAction = { move: 0, jump: false, attack: false, special: false, block: false };

    const loop = setInterval(() => {
      if (gameOverRef.current) return;

      const keys = keysRef.current;
      let p = { ...playerRef.current };
      let e = { ...enemyRef.current };

      // --- Player movement ---
      const pSpeed = MOVE_SPEED_BASE + p.fighter.speed * 0.3;
      p.vx = 0;
      if (!p.isBlocking) {
        if (keys.left) { p.vx = -pSpeed; p.facing = "left"; }
        if (keys.right) { p.vx = pSpeed; p.facing = "right"; }
      }
      if (keys.up && !p.isJumping) {
        p.vy = JUMP_FORCE;
        p.isJumping = true;
      }
      p.isBlocking = keys.block && !p.isJumping;

      // Player physics
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; p.isJumping = false; }
      p.x = Math.max(10, Math.min(ARENA_WIDTH - PLAYER_WIDTH - 10, p.x));

      // Player attack
      if (p.attackCooldown > 0) p.attackCooldown--;
      if (p.specialCooldown > 0) p.specialCooldown--;
      p.isAttacking = false;
      p.isSpecial = false;

      if (keys.attack && p.attackCooldown <= 0) {
        p.isAttacking = true;
        p.attackCooldown = ATTACK_COOLDOWN;
        p.attackFrame = 8;
        // Check hit
        const dist = Math.abs((p.x + PLAYER_WIDTH / 2) - (e.x + PLAYER_WIDTH / 2));
        if (dist < ATTACK_RANGE) {
          const baseDmg = p.fighter.attack;
          const def = e.isBlocking ? e.fighter.defense * 0.8 : e.fighter.defense * 0.3;
          const variance = Math.floor(Math.random() * 4) - 2;
          const dmg = Math.max(1, Math.round(baseDmg - def + variance));
          e.hp = Math.max(0, e.hp - dmg);
          e.isHit = true;
          e.vx = p.facing === "right" ? 6 : -6;
          p.specialCharge = Math.min(SPECIAL_CHARGE_NEEDED, p.specialCharge + 15);
          setCombo(prev => prev + 1);
          addHitEffect(e.x + PLAYER_WIDTH / 2, e.y - 20, dmg);
          setTimeout(() => {
            setEnemy(prev => ({ ...prev, isHit: false }));
          }, 200);
        } else {
          setCombo(0);
        }
      }

      if (keys.special && p.specialCharge >= SPECIAL_CHARGE_NEEDED && p.specialCooldown <= 0) {
        p.isSpecial = true;
        p.specialCharge = 0;
        p.specialCooldown = 60;
        p.attackFrame = 12;
        const dist = Math.abs((p.x + PLAYER_WIDTH / 2) - (e.x + PLAYER_WIDTH / 2));
        if (dist < ATTACK_RANGE * 1.5) {
          const baseDmg = p.fighter.specialDamage;
          const def = e.isBlocking ? e.fighter.defense * 0.5 : e.fighter.defense * 0.2;
          const dmg = Math.max(5, Math.round(baseDmg - def));
          e.hp = Math.max(0, e.hp - dmg);
          e.isHit = true;
          e.vx = (p.facing === "right" ? 12 : -12);
          addHitEffect(e.x + PLAYER_WIDTH / 2, e.y - 40, dmg);
          setTimeout(() => {
            setEnemy(prev => ({ ...prev, isHit: false }));
          }, 300);
        }
      }

      if (p.attackFrame > 0) p.attackFrame--;

      // --- Enemy AI ---
      aiTimer++;
      if (aiTimer % 20 === 0) {
        const distToPlayer = p.x - e.x;
        const absDist = Math.abs(distToPlayer);
        
        if (absDist > ATTACK_RANGE * 1.2) {
          aiAction.move = distToPlayer > 0 ? 1 : -1;
          aiAction.attack = false;
          aiAction.block = false;
        } else {
          aiAction.move = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          aiAction.attack = Math.random() > 0.4;
          aiAction.special = e.specialCharge >= SPECIAL_CHARGE_NEEDED && Math.random() > 0.6;
          aiAction.block = !aiAction.attack && Math.random() > 0.5;
        }
        aiAction.jump = Math.random() > 0.9;
      }

      const eSpeed = MOVE_SPEED_BASE + e.fighter.speed * 0.25;
      e.vx = aiAction.move * eSpeed * 0.7;
      e.isBlocking = aiAction.block && !e.isJumping;
      if (aiAction.jump && !e.isJumping) {
        e.vy = JUMP_FORCE;
        e.isJumping = true;
        aiAction.jump = false;
      }

      // Enemy physics
      e.vy += GRAVITY;
      e.x += e.vx;
      e.y += e.vy;
      if (e.y >= GROUND_Y) { e.y = GROUND_Y; e.vy = 0; e.isJumping = false; }
      e.x = Math.max(10, Math.min(ARENA_WIDTH - PLAYER_WIDTH - 10, e.x));

      // Enemy attack
      if (e.attackCooldown > 0) e.attackCooldown--;
      if (e.specialCooldown > 0) e.specialCooldown--;
      e.isAttacking = false;
      e.isSpecial = false;

      if (aiAction.attack && e.attackCooldown <= 0) {
        const dist = Math.abs((p.x + PLAYER_WIDTH / 2) - (e.x + PLAYER_WIDTH / 2));
        if (dist < ATTACK_RANGE) {
          e.isAttacking = true;
          e.attackCooldown = ATTACK_COOLDOWN + 5;
          e.attackFrame = 8;
          const baseDmg = e.fighter.attack;
          const def = p.isBlocking ? p.fighter.defense * 0.8 : p.fighter.defense * 0.3;
          const variance = Math.floor(Math.random() * 4) - 2;
          const dmg = Math.max(1, Math.round(baseDmg - def + variance));
          p.hp = Math.max(0, p.hp - dmg);
          p.isHit = true;
          p.vx = e.facing === "right" ? 6 : -6;
          e.specialCharge = Math.min(SPECIAL_CHARGE_NEEDED, e.specialCharge + 15);
          addHitEffect(p.x + PLAYER_WIDTH / 2, p.y - 20, dmg);
          setTimeout(() => {
            setPlayer(prev => ({ ...prev, isHit: false }));
          }, 200);
        }
        aiAction.attack = false;
      }

      if (aiAction.special && e.specialCharge >= SPECIAL_CHARGE_NEEDED && e.specialCooldown <= 0) {
        const dist = Math.abs((p.x + PLAYER_WIDTH / 2) - (e.x + PLAYER_WIDTH / 2));
        if (dist < ATTACK_RANGE * 1.5) {
          e.isSpecial = true;
          e.specialCharge = 0;
          e.specialCooldown = 60;
          e.attackFrame = 12;
          const baseDmg = e.fighter.specialDamage;
          const def = p.isBlocking ? p.fighter.defense * 0.5 : p.fighter.defense * 0.2;
          const dmg = Math.max(5, Math.round(baseDmg - def));
          p.hp = Math.max(0, p.hp - dmg);
          p.isHit = true;
          addHitEffect(p.x + PLAYER_WIDTH / 2, p.y - 40, dmg);
          setTimeout(() => {
            setPlayer(prev => ({ ...prev, isHit: false }));
          }, 300);
        }
        aiAction.special = false;
      }

      if (e.attackFrame > 0) e.attackFrame--;

      // Face each other
      e.facing = e.x > p.x ? "left" : "right";

      // Collision between players
      if (Math.abs(p.x - e.x) < PLAYER_WIDTH * 0.7) {
        if (p.x < e.x) { p.x -= 3; e.x += 3; }
        else { p.x += 3; e.x -= 3; }
      }

      // Check game over
      if (p.hp <= 0) {
        setGameOver(true);
        setWinner("enemy");
      } else if (e.hp <= 0) {
        setGameOver(true);
        setWinner("player");
      }

      setPlayer(p);
      setEnemy(e);
    }, FRAME_RATE);

    return () => clearInterval(loop);
  }, [addHitEffect]);

  const reset = useCallback(() => {
    setPlayer(createPlayer(playerFighter, 150, "right"));
    setEnemy(createPlayer(enemyFighter, 600, "left"));
    setGameOver(false);
    setWinner(null);
    setCombo(0);
    setHitEffects([]);
  }, [playerFighter, enemyFighter]);

  return { player, enemy, gameOver, winner, combo, hitEffects, reset, arenaWidth: ARENA_WIDTH, groundY: GROUND_Y, playerWidth: PLAYER_WIDTH, playerHeight: PLAYER_HEIGHT };
}
