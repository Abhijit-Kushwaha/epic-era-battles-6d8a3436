import { Fighter } from "@/game/gameData";

interface FighterCardProps {
  fighter: Fighter;
  isEnemy?: boolean;
  showDamage?: number | null;
  isHit?: boolean;
}

const FighterCard = ({ fighter, isEnemy, showDamage, isHit }: FighterCardProps) => {
  const hpPercent = (fighter.hp / fighter.maxHp) * 100;
  const hpClass = hpPercent > 60 ? "high" : hpPercent > 30 ? "medium" : "";

  return (
    <div className={`relative flex flex-col items-center ${isHit ? "shake" : ""}`}>
      {showDamage && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 float-damage font-display font-bold text-2xl text-secondary">
          -{showDamage}
        </div>
      )}

      <div className={`text-6xl md:text-8xl mb-3 transition-transform duration-200 ${isHit ? "flash-red" : ""}`}>
        {fighter.emoji}
      </div>

      <h3 className="font-display font-bold text-lg gold-gradient-text">{fighter.name}</h3>
      <p className="text-muted-foreground text-sm mb-2">{fighter.title}</p>

      <div className="w-full max-w-[200px]">
        <div className="flex justify-between text-xs mb-1 font-body font-semibold">
          <span>HP</span>
          <span>{fighter.hp}/{fighter.maxHp}</span>
        </div>
        <div className="health-bar">
          <div
            className={`health-bar-fill ${hpClass}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
        <span>⚔️ {fighter.attack}</span>
        <span>🛡️ {fighter.defense}</span>
        <span>⚡ {fighter.speed}</span>
      </div>
    </div>
  );
};

export default FighterCard;
