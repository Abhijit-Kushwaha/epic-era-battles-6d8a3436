import { useEffect, useRef } from "react";
import { Era, Fighter, ERAS } from "@/game/gameData";
import { useCombat } from "@/game/useCombat";
import FighterCard from "@/components/FighterCard";

interface CombatArenaProps {
  era: Era;
  player: Fighter;
  onEnd: () => void;
}

const CombatArena = ({ era, player, onEnd }: CombatArenaProps) => {
  // Pick random enemy from any era, excluding selected fighter
  const allFighters = ERAS.flatMap((e) => e.fighters);
  const enemies = allFighters.filter((f) => f.id !== player.id);
  const enemy = useRef(enemies[Math.floor(Math.random() * enemies.length)]).current;

  const { state, playerAttack, defend } = useCombat(player, enemy);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.logs]);

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${era.bgImage})` }}
      />
      <div className="arena-overlay" />

      <div className="relative z-10 flex flex-col flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="font-display font-bold text-2xl gold-gradient-text">⚔️ BATTLE ARENA ⚔️</h2>
          <p className="text-sm text-muted-foreground">{era.name}</p>
        </div>

        {/* Fighters */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1 flex justify-center">
            <FighterCard
              fighter={state.player}
              showDamage={state.damageFloat?.target === "player" ? state.damageFloat.amount : null}
              isHit={state.damageFloat?.target === "player"}
            />
          </div>

          <div className="flex items-center self-center">
            <span className="font-display font-black text-3xl text-primary animate-pulse-glow px-4 py-2 rounded-lg">
              VS
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <FighterCard
              fighter={state.enemy}
              isEnemy
              showDamage={state.damageFloat?.target === "enemy" ? state.damageFloat.amount : null}
              isHit={state.damageFloat?.target === "enemy"}
            />
          </div>
        </div>

        {/* Combat Log */}
        <div className="bg-card/80 backdrop-blur rounded-lg border border-border p-3 mb-4 h-32 overflow-y-auto">
          {state.logs.map((log) => (
            <p
              key={log.id}
              className={`text-sm font-body ${
                log.type === "special" ? "text-accent font-bold" :
                log.type === "attack" ? "text-secondary" :
                log.type === "heal" ? "text-green-400" :
                "text-muted-foreground"
              }`}
            >
              {log.text}
            </p>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Actions */}
        {state.gameOver ? (
          <div className="text-center space-y-4">
            <h3 className="font-display font-black text-4xl gold-gradient-text">
              {state.winner === "player" ? "🏆 VICTORY! 🏆" : "💀 DEFEATED 💀"}
            </h3>
            <p className="text-muted-foreground">
              {state.winner === "player"
                ? `${state.player.name} stands victorious!`
                : `${state.enemy.name} has triumphed...`}
            </p>
            <button onClick={onEnd} className="btn-gold">
              Fight Again
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => playerAttack(false)}
              disabled={state.turn !== "player" || state.isAnimating}
              className="btn-attack disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⚔️ Attack
            </button>
            <button
              onClick={() => playerAttack(true)}
              disabled={state.turn !== "player" || state.isAnimating || state.specialCooldown > 0}
              className="btn-special disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⚡ {player.specialName}
              {state.specialCooldown > 0 && ` (${state.specialCooldown})`}
            </button>
            <button
              onClick={defend}
              disabled={state.turn !== "player" || state.isAnimating}
              className="btn-attack disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, hsl(120, 40%, 35%), hsl(120, 40%, 25%))", borderColor: "hsl(120, 40%, 40%)" }}
            >
              🛡️ Defend
            </button>
          </div>
        )}

        {!state.gameOver && state.turn === "enemy" && (
          <p className="text-center text-muted-foreground text-sm mt-3 animate-pulse">
            {state.enemy.name} is attacking...
          </p>
        )}
      </div>
    </div>
  );
};

export default CombatArena;
