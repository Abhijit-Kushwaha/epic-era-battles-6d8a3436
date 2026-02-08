import { useRef, useEffect, useState, useMemo } from "react";
import { Era, Fighter, ERAS } from "@/game/gameData";
import { useGameEngine, GamePlayer } from "@/game/useGameEngine";

interface CombatArena2DProps {
  era: Era;
  player: Fighter;
  onEnd: (won: boolean) => void;
}

const PlayerSprite = ({
  gp,
  label,
  isPlayer,
}: {
  gp: GamePlayer;
  label: string;
  isPlayer?: boolean;
}) => {
  const bodyColor = gp.fighter.color;
  const isFlipped = gp.facing === "left";
  const isAttacking = gp.attackFrame > 0;
  const limbAngle = isAttacking ? (gp.isSpecial ? 70 : 45) : 0;

  return (
    <div
      className="absolute transition-none"
      style={{
        left: gp.x,
        bottom: `calc(100% - ${gp.y}px - 80px)`,
        width: 60,
        height: 80,
        transform: `scaleX(${isFlipped ? -1 : 1})`,
        filter: gp.isHit ? "brightness(3) saturate(2)" : "none",
        zIndex: 10,
      }}
    >
      {/* Shadow */}
      <div
        className="absolute rounded-full opacity-30"
        style={{
          bottom: -4,
          left: 10,
          width: 40,
          height: 10,
          background: "rgba(0,0,0,0.6)",
        }}
      />
      
      {/* Body */}
      <svg width="60" height="80" viewBox="0 0 60 80" className="absolute inset-0">
        {/* Legs */}
        <rect x="18" y="55" width="8" height="22" rx="3" fill={bodyColor} opacity="0.8"
          style={{ transform: gp.isJumping ? "rotate(-15deg)" : `rotate(${gp.vx > 0 ? Math.sin(Date.now() / 100) * 15 : gp.vx < 0 ? Math.sin(Date.now() / 100) * 15 : 0}deg)`, transformOrigin: "22px 55px" }}
        />
        <rect x="34" y="55" width="8" height="22" rx="3" fill={bodyColor} opacity="0.8"
          style={{ transform: gp.isJumping ? "rotate(15deg)" : `rotate(${gp.vx > 0 ? -Math.sin(Date.now() / 100) * 15 : gp.vx < 0 ? -Math.sin(Date.now() / 100) * 15 : 0}deg)`, transformOrigin: "38px 55px" }}
        />
        
        {/* Torso */}
        <rect x="15" y="28" width="30" height="30" rx="5" fill={bodyColor} />
        
        {/* Head */}
        <circle cx="30" cy="18" r="14" fill={bodyColor} />
        <circle cx="25" cy="15" r="2" fill="#fff" />
        <circle cx="35" cy="15" r="2" fill="#fff" />
        <circle cx="25" cy="15" r="1" fill="#111" />
        <circle cx="35" cy="15" r="1" fill="#111" />
        
        {/* Arm - attack arm */}
        <rect x="42" y="32" width="6" height="20" rx="3" fill={bodyColor} opacity="0.9"
          style={{
            transform: `rotate(${isAttacking ? -limbAngle : -10}deg)`,
            transformOrigin: "45px 32px",
            transition: "transform 0.08s",
          }}
        />
        {/* Weapon indicator for attack */}
        {isAttacking && (
          <circle cx={gp.isSpecial ? 58 : 52} cy={gp.isSpecial ? 18 : 25} r={gp.isSpecial ? 8 : 5}
            fill={gp.isSpecial ? "#00e5ff" : "#ff4444"}
            opacity="0.8"
          />
        )}
        
        {/* Shield arm */}
        <rect x="12" y="32" width="6" height="18" rx="3" fill={bodyColor} opacity="0.9"
          style={{
            transform: gp.isBlocking ? "rotate(30deg)" : "rotate(10deg)",
            transformOrigin: "15px 32px",
            transition: "transform 0.1s",
          }}
        />
        {gp.isBlocking && (
          <rect x="2" y="28" width="14" height="18" rx="3" fill="#888" opacity="0.6" stroke="#aaa" strokeWidth="1" />
        )}
      </svg>

      {/* Name label */}
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-display font-bold"
        style={{ color: bodyColor, transform: `scaleX(${isFlipped ? -1 : 1}) translateX(-50%)`, textShadow: "0 0 8px rgba(0,0,0,0.8)" }}
      >
        {label}
      </div>

      {/* Emoji above head */}
      <div
        className="absolute -top-12 left-1/2 text-2xl"
        style={{ transform: `scaleX(${isFlipped ? -1 : 1}) translateX(-50%)` }}
      >
        {gp.fighter.emoji}
      </div>
    </div>
  );
};

const HealthBar = ({
  current,
  max,
  specialCharge,
  specialMax,
  name,
  isEnemy,
}: {
  current: number;
  max: number;
  specialCharge: number;
  specialMax: number;
  name: string;
  isEnemy?: boolean;
}) => {
  const hpPct = Math.max(0, (current / max) * 100);
  const spPct = (specialCharge / specialMax) * 100;

  return (
    <div className={`flex-1 ${isEnemy ? "text-right" : ""}`}>
      <div className="flex items-center gap-2 mb-1" style={{ flexDirection: isEnemy ? "row-reverse" : "row" }}>
        <span className="font-display font-bold text-sm gold-gradient-text">{name}</span>
        <span className="text-xs text-muted-foreground">{current}/{max}</span>
      </div>
      <div className="health-bar h-5" style={{ direction: isEnemy ? "rtl" : "ltr" }}>
        <div
          className={`health-bar-fill ${hpPct > 60 ? "high" : hpPct > 30 ? "medium" : ""}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      <div className="mt-1 h-2 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${spPct}%`,
            background: spPct >= 100 ? "linear-gradient(90deg, #00e5ff, #76ff03)" : "linear-gradient(90deg, hsl(200, 80%, 50%), hsl(200, 60%, 40%))",
            direction: isEnemy ? "rtl" : "ltr",
          }}
        />
      </div>
      {spPct >= 100 && (
        <p className="text-xs mt-0.5 font-bold animate-pulse" style={{ color: "#00e5ff", textAlign: isEnemy ? "right" : "left" }}>
          ⚡ SPECIAL READY
        </p>
      )}
    </div>
  );
};

const CombatArena2D = ({ era, player, onEnd }: CombatArena2DProps) => {
  const allFighters = ERAS.flatMap((e) => e.fighters);
  const enemies = allFighters.filter((f) => f.id !== player.id);
  const enemyFighter = useMemo(() => enemies[Math.floor(Math.random() * enemies.length)], []);

  const {
    player: p,
    enemy: e,
    gameOver,
    winner,
    combo,
    hitEffects,
    reset,
    arenaWidth,
    groundY,
  } = useGameEngine(player, enemyFighter);

  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${era.bgImage})` }}
      />
      <div className="arena-overlay" />

      <div className="relative z-10 w-full max-w-[850px] mx-auto px-4 py-4">
        {/* HUD */}
        <div className="flex items-start gap-4 mb-4">
          <HealthBar
            current={p.hp}
            max={p.maxHp}
            specialCharge={p.specialCharge}
            specialMax={p.specialChargeMax}
            name={p.fighter.name}
          />
          <div className="font-display font-black text-2xl text-primary px-3 pt-1">VS</div>
          <HealthBar
            current={e.hp}
            max={e.maxHp}
            specialCharge={e.specialCharge}
            specialMax={e.specialChargeMax}
            name={e.fighter.name}
            isEnemy
          />
        </div>

        {/* Combo counter */}
        {combo > 1 && (
          <div className="text-center mb-2">
            <span className="font-display font-bold text-primary text-lg">
              🔥 {combo} HIT COMBO!
            </span>
          </div>
        )}

        {/* Arena */}
        <div
          className="relative rounded-xl overflow-hidden border-2 border-border"
          style={{
            width: arenaWidth,
            height: groundY + 30,
            margin: "0 auto",
            background: "linear-gradient(to bottom, transparent 60%, hsl(220, 20%, 4%) 100%)",
          }}
        >
          {/* Arena bg */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${era.bgImage})` }}
          />

          {/* Ground line */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{ bottom: `calc(100% - ${groundY}px - 80px)`, background: "hsl(42, 85%, 55%, 0.3)" }}
          />

          {/* Players */}
          <PlayerSprite gp={p} label={p.fighter.name} isPlayer />
          <PlayerSprite gp={e} label={e.fighter.name} />

          {/* Hit effects */}
          {hitEffects.map((eff) => (
            <div
              key={eff.id}
              className="absolute float-damage font-display font-black text-xl pointer-events-none"
              style={{
                left: eff.x,
                bottom: `calc(100% - ${eff.y}px)`,
                color: "#ff4444",
                textShadow: "0 0 10px rgba(255,0,0,0.8)",
              }}
            >
              -{eff.damage}
            </div>
          ))}

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <h2 className="font-display font-black text-5xl mb-2 gold-gradient-text">
                {winner === "player" ? "🏆 VICTORY!" : "💀 DEFEATED"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {winner === "player"
                  ? `${p.fighter.name} dominates the arena!`
                  : `${e.fighter.name} wins this round...`}
              </p>
              <div className="flex gap-3">
                <button onClick={reset} className="btn-gold text-sm">
                  Rematch
                </button>
                <button onClick={() => onEnd(winner === "player")} className="btn-attack text-sm">
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        {showControls && (
          <div className="mt-4 bg-card/80 backdrop-blur rounded-lg border border-border p-3 text-center animate-fade-in">
            <p className="font-display text-sm text-primary mb-2">⌨️ CONTROLS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground font-body">
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">A/D</kbd> Move</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">W/Space</kbd> Jump</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">J</kbd> Attack</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">K</kbd> Special</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">S</kbd> Block</span>
              <span className="text-accent">Fill special gauge to use K!</span>
            </div>
          </div>
        )}

        {/* Mobile controls */}
        <div className="mt-4 flex md:hidden justify-center gap-2 flex-wrap">
          <MobileButton label="←" keys="left" />
          <MobileButton label="→" keys="right" />
          <MobileButton label="↑" keys="up" />
          <MobileButton label="⚔️" keys="attack" />
          <MobileButton label="⚡" keys="special" />
          <MobileButton label="🛡️" keys="block" />
        </div>
      </div>
    </div>
  );
};

const MobileButton = ({ label, keys }: { label: string; keys: string }) => {
  const handleStart = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: keyMap[keys] }));
  };
  const handleEnd = () => {
    window.dispatchEvent(new KeyboardEvent("keyup", { key: keyMap[keys] }));
  };
  const keyMap: Record<string, string> = {
    left: "a", right: "d", up: "w", attack: "j", special: "k", block: "s",
  };

  return (
    <button
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      className="w-12 h-12 rounded-lg bg-card/80 border border-border text-lg flex items-center justify-center active:bg-primary active:text-primary-foreground select-none"
    >
      {label}
    </button>
  );
};

export default CombatArena2D;
