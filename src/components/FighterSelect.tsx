import { Era, Fighter } from "@/game/gameData";

interface FighterSelectProps {
  era: Era;
  onSelect: (fighter: Fighter) => void;
  onBack: () => void;
}

const FighterSelect = ({ era, onSelect, onBack }: FighterSelectProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <button onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors mb-6 font-body text-sm">
        ← Back to Era Select
      </button>

      <h2 className="font-display font-bold text-3xl gold-gradient-text text-center mb-2">
        Choose Your Fighter
      </h2>
      <p className="text-center text-muted-foreground mb-8">{era.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {era.fighters.map((fighter) => (
          <button
            key={fighter.id}
            onClick={() => onSelect(fighter)}
            className="card-battle cursor-pointer flex flex-col items-center py-8 group"
          >
            <div className="text-6xl mb-4 transition-transform duration-200 group-hover:scale-125">
              {fighter.emoji}
            </div>
            <h3 className="font-display font-bold text-xl gold-gradient-text mb-1">
              {fighter.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{fighter.title}</p>

            <div className="grid grid-cols-3 gap-4 text-center text-sm w-full">
              <div>
                <div className="text-primary font-bold">{fighter.attack}</div>
                <div className="text-xs text-muted-foreground">ATK</div>
              </div>
              <div>
                <div className="text-primary font-bold">{fighter.defense}</div>
                <div className="text-xs text-muted-foreground">DEF</div>
              </div>
              <div>
                <div className="text-primary font-bold">{fighter.speed}</div>
                <div className="text-xs text-muted-foreground">SPD</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-accent">
              ⚡ {fighter.specialName} ({fighter.specialDamage} DMG)
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FighterSelect;
