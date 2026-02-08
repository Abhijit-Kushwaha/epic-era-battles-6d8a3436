import { useState } from "react";
import { Era, Fighter, ERAS } from "@/game/gameData";
import EraSelect from "@/components/EraSelect";
import FighterSelect from "@/components/FighterSelect";
import CombatArena from "@/components/CombatArena";
import heroBg from "@/assets/hero-bg.jpg";

type Screen = "home" | "era" | "fighter" | "combat";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);

  const handleEraSelect = (era: Era) => {
    setSelectedEra(era);
    setScreen("fighter");
  };

  const handleFighterSelect = (fighter: Fighter) => {
    setSelectedFighter(fighter);
    setScreen("combat");
  };

  const handleReset = () => {
    setScreen("era");
    setSelectedFighter(null);
  };

  if (screen === "combat" && selectedEra && selectedFighter) {
    return (
      <CombatArena
        key={selectedFighter.id + Date.now()}
        era={selectedEra}
        player={selectedFighter}
        onEnd={handleReset}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background for home/era/fighter screens */}
      {screen === "home" && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="arena-overlay" />
        </>
      )}

      <div className="relative z-10 w-full py-12">
        {screen === "home" && (
          <div className="flex flex-col items-center text-center px-4">
            <h1 className="font-display font-black text-5xl md:text-7xl gold-gradient-text mb-4 leading-tight">
              ERA WARS
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-2 font-body">
              Warriors from across history clash in the ultimate battle
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Choose your era. Pick your fighter. Dominate the arena.
            </p>
            <button
              onClick={() => setScreen("era")}
              className="btn-gold text-lg animate-pulse-glow"
            >
              ⚔️ Enter the Arena
            </button>
          </div>
        )}

        {screen === "era" && (
          <div className="flex flex-col items-center">
            <h2 className="font-display font-bold text-3xl gold-gradient-text text-center mb-8">
              Choose Your Era
            </h2>
            <EraSelect eras={ERAS} onSelect={handleEraSelect} />
          </div>
        )}

        {screen === "fighter" && selectedEra && (
          <FighterSelect
            era={selectedEra}
            onSelect={handleFighterSelect}
            onBack={() => setScreen("era")}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
