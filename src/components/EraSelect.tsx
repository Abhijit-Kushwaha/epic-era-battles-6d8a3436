import { Era } from "@/game/gameData";

interface EraSelectProps {
  eras: Era[];
  onSelect: (era: Era) => void;
}

const EraSelect = ({ eras, onSelect }: EraSelectProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto px-4">
      {eras.map((era) => (
        <button
          key={era.id}
          onClick={() => onSelect(era)}
          className="card-battle group cursor-pointer h-72 flex flex-col justify-end text-left"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${era.bgImage})` }}
          />
          <div className="arena-overlay" />
          <div className="relative z-10">
            <p className="text-xs font-body font-semibold text-primary tracking-widest uppercase mb-1">
              {era.subtitle}
            </p>
            <h3 className="font-display font-bold text-2xl gold-gradient-text mb-1">
              {era.name}
            </h3>
            <p className="text-sm text-muted-foreground">{era.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default EraSelect;
