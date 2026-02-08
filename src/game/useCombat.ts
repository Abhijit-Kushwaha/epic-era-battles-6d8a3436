import { useState, useCallback } from "react";
import { Fighter } from "@/game/gameData";

export interface CombatLog {
  id: number;
  text: string;
  type: "attack" | "special" | "damage" | "heal" | "info";
}

export interface CombatState {
  player: Fighter;
  enemy: Fighter;
  turn: "player" | "enemy";
  logs: CombatLog[];
  specialCooldown: number;
  enemyCooldown: number;
  isAnimating: boolean;
  gameOver: boolean;
  winner: "player" | "enemy" | null;
  damageFloat: { target: "player" | "enemy"; amount: number; id: number } | null;
}

let logId = 0;

export function useCombat(playerFighter: Fighter, enemyFighter: Fighter) {
  const [state, setState] = useState<CombatState>({
    player: { ...playerFighter },
    enemy: { ...enemyFighter },
    turn: "player",
    logs: [{ id: logId++, text: `${playerFighter.name} vs ${enemyFighter.name} — FIGHT!`, type: "info" }],
    specialCooldown: 0,
    enemyCooldown: 0,
    isAnimating: false,
    gameOver: false,
    winner: null,
    damageFloat: null,
  });

  const calcDamage = (attacker: Fighter, defender: Fighter, isSpecial: boolean) => {
    const base = isSpecial ? attacker.specialDamage : attacker.attack;
    const reduction = defender.defense * 0.3;
    const variance = Math.floor(Math.random() * 6) - 3;
    return Math.max(1, Math.round(base - reduction + variance));
  };

  const doEnemyTurn = useCallback((currentState: CombatState) => {
    setTimeout(() => {
      setState((prev) => {
        if (prev.gameOver) return prev;
        const useSpecial = prev.enemyCooldown <= 0 && Math.random() > 0.5;
        const damage = calcDamage(prev.enemy, prev.player, useSpecial);
        const newPlayerHp = Math.max(0, prev.player.hp - damage);
        const actionText = useSpecial
          ? `${prev.enemy.name} uses ${prev.enemy.specialName}! 💥 ${damage} damage!`
          : `${prev.enemy.name} attacks! ⚔️ ${damage} damage!`;
        const isOver = newPlayerHp <= 0;
        return {
          ...prev,
          player: { ...prev.player, hp: newPlayerHp },
          turn: "player",
          specialCooldown: Math.max(0, prev.specialCooldown - 1),
          enemyCooldown: useSpecial ? prev.enemy.specialCooldown : Math.max(0, prev.enemyCooldown - 1),
          logs: [...prev.logs, { id: logId++, text: actionText, type: useSpecial ? "special" : "attack" }],
          isAnimating: false,
          gameOver: isOver,
          winner: isOver ? "enemy" : null,
          damageFloat: { target: "player", amount: damage, id: logId },
        };
      });
    }, 1000);
  }, []);

  const playerAttack = useCallback((isSpecial: boolean) => {
    setState((prev) => {
      if (prev.turn !== "player" || prev.isAnimating || prev.gameOver) return prev;
      if (isSpecial && prev.specialCooldown > 0) return prev;
      const damage = calcDamage(prev.player, prev.enemy, isSpecial);
      const newEnemyHp = Math.max(0, prev.enemy.hp - damage);
      const actionText = isSpecial
        ? `${prev.player.name} uses ${prev.player.specialName}! 💥 ${damage} damage!`
        : `${prev.player.name} attacks! ⚔️ ${damage} damage!`;
      const isOver = newEnemyHp <= 0;
      const newState: CombatState = {
        ...prev,
        enemy: { ...prev.enemy, hp: newEnemyHp },
        turn: "enemy",
        specialCooldown: isSpecial ? prev.player.specialCooldown : prev.specialCooldown,
        logs: [...prev.logs, { id: logId++, text: actionText, type: isSpecial ? "special" : "attack" }],
        isAnimating: !isOver,
        gameOver: isOver,
        winner: isOver ? "player" : null,
        damageFloat: { target: "enemy", amount: damage, id: logId },
      };
      return newState;
    });
    // Trigger enemy turn
    setState((prev) => {
      if (!prev.gameOver && prev.turn === "enemy") {
        doEnemyTurn(prev);
      }
      return prev;
    });
  }, [doEnemyTurn]);

  const defend = useCallback(() => {
    setState((prev) => {
      if (prev.turn !== "player" || prev.isAnimating || prev.gameOver) return prev;
      const healAmount = Math.floor(prev.player.defense * 0.5);
      const newHp = Math.min(prev.player.maxHp, prev.player.hp + healAmount);
      const newState: CombatState = {
        ...prev,
        player: { ...prev.player, hp: newHp, defense: prev.player.defense + 2 },
        turn: "enemy",
        specialCooldown: Math.max(0, prev.specialCooldown - 1),
        logs: [...prev.logs, { id: logId++, text: `${prev.player.name} defends! 🛡️ +${healAmount} HP, +2 DEF`, type: "heal" }],
        isAnimating: true,
        damageFloat: null,
      };
      return newState;
    });
    setState((prev) => {
      if (!prev.gameOver && prev.turn === "enemy") {
        doEnemyTurn(prev);
      }
      return prev;
    });
  }, [doEnemyTurn]);

  return { state, playerAttack, defend };
}
