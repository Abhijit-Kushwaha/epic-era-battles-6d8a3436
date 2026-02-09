import { useState, useCallback, useMemo } from "react";
import { Era, Fighter, ERAS } from "@/game/gameData";
import EraSelect from "@/components/EraSelect";
import FighterSelect from "@/components/FighterSelect";
import CombatArena3D from "@/components/CombatArena3D";
import HistoryFactScreen from "@/components/HistoryFactScreen";
import heroBg from "@/assets/hero-bg.jpg";

type Screen = "home" | "era" | "fighter" | "combat" | "fact";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [lastWon, setLastWon] = useState(false);
  const [combatKey, setCombatKey] = useState(0);

  const randomFact = useMemo(() => {
    if (!selectedEra) return null;
    const facts = selectedEra.facts;
    return facts[Math.floor(Math.random() * facts.length)];
  }, [selectedEra, screen]);

  const handleEraSelect = (era: Era) => {
    setSelectedEra(era);
    setScreen("fighter");
  };

  const handleFighterSelect = (fighter: Fighter) => {
    setSelectedFighter(fighter);
    setCombatKey((k) => k + 1);
    setScreen("combat");
  };

  const handleCombatEnd = useCallback((won: boolean) => {
    setLastWon(won);
    setScreen("fact");
  }, []);

  const handleFightAgain = useCallback(() => {
    setCombatKey((k) => k + 1);
    setScreen("combat");
  }, []);

  const handleNewBattle = useCallback(() => {
    setScreen("era");
    setSelectedFighter(null);
    setSelectedEra(null);
  }, []);

  if (screen === "combat" && selectedEra && selectedFighter) {
    return (
      <CombatArena3D
        key={combatKey}
        era={selectedEra}
        player={selectedFighter}
        onEnd={handleCombatEnd}
      />
    );
  }

  if (screen === "fact" && selectedEra && randomFact) {
    return (
      <HistoryFactScreen
        fact={randomFact}
        won={lastWon}
        onContinue={handleNewBattle}
        onFightAgain={handleFightAgain}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
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
              Fight through history. Learn from the past.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Real-time 2D combat with warriors from every era. Move, jump, attack, and discover historical truths.
            </p>
            <button
              onClick={() => setScreen("era")}
              className="btn-gold text-lg animate-pulse-glow"
            >
              ⚔️ Enter the Arena
            </button>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center max-w-sm">
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">🎮</div>
                <p className="text-xs text-muted-foreground">Real-time 2D Combat</p>
              </div>
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">📜</div>
                <p className="text-xs text-muted-foreground">Learn History</p>
              </div>
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">⚔️</div>
                <p className="text-xs text-muted-foreground">Cross-Era Fights</p>
              </div>
            </div>
          </div>
        )}

        {screen === "era" && (
          <div className="flex flex-col items-center">
            <h2 className="font-display font-bold text-3xl gold-gradient-text text-center mb-2">
              Choose Your Era
            </h2>
            <p className="text-sm text-muted-foreground mb-8 text-center">
              Each era holds warriors and lessons from history
            </p>
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
