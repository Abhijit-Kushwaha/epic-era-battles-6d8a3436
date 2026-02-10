import { useState, useCallback, useMemo } from "react";
import { Era, Fighter, ERAS } from "@/game/gameData";
import EraSelect from "@/components/EraSelect";
import FighterSelect from "@/components/FighterSelect";
import CombatArena3D from "@/components/CombatArena3D";
import HistoryFactScreen from "@/components/HistoryFactScreen";
import ShopScreen from "@/components/ShopScreen";
import { PlayerEconomy, createEconomy, addCoins } from "@/game/economySystem";
import heroBg from "@/assets/hero-bg.jpg";

type Screen = "home" | "era" | "fighter" | "shop" | "combat" | "fact";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [lastWon, setLastWon] = useState(false);
  const [combatKey, setCombatKey] = useState(0);
  const [economy, setEconomy] = useState<PlayerEconomy>(createEconomy);

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
    setScreen("shop");
  };

  const handleStartBattle = useCallback(() => {
    setCombatKey((k) => k + 1);
    setScreen("combat");
  }, []);

  const handleCombatEnd = useCallback((won: boolean, earnedCoins: number) => {
    setLastWon(won);
    setEconomy(prev => addCoins(prev, earnedCoins + (won ? 200 : 0)));
    setScreen("fact");
  }, []);

  const handleFightAgain = useCallback(() => {
    setScreen("shop");
  }, []);

  const handleNewBattle = useCallback(() => {
    setScreen("era");
    setSelectedFighter(null);
    setSelectedEra(null);
  }, []);

  if (screen === "shop" && selectedEra && selectedFighter) {
    return (
      <ShopScreen
        era={selectedEra}
        economy={economy}
        onPurchase={setEconomy}
        onStartBattle={handleStartBattle}
        onBack={() => setScreen("fighter")}
      />
    );
  }

  if (screen === "combat" && selectedEra && selectedFighter) {
    return (
      <CombatArena3D
        key={combatKey}
        era={selectedEra}
        player={selectedFighter}
        economy={economy}
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
            <p className="text-sm text-muted-foreground mb-4">
              3D combat across 4 eras • Smart AI bots • Earn coins • Buy upgrades
            </p>
            {economy.totalEarned > 0 && (
              <p className="text-sm text-primary font-display mb-4">🪙 {economy.coins} coins available</p>
            )}
            <button
              onClick={() => setScreen("era")}
              className="btn-gold text-lg animate-pulse-glow"
            >
              ⚔️ Enter the Arena
            </button>

            <div className="mt-8 grid grid-cols-4 gap-3 text-center max-w-md">
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">🎮</div>
                <p className="text-xs text-muted-foreground">3D Combat</p>
              </div>
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">🤖</div>
                <p className="text-xs text-muted-foreground">Smart AI</p>
              </div>
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">🪙</div>
                <p className="text-xs text-muted-foreground">Economy</p>
              </div>
              <div className="card-battle p-3">
                <div className="text-2xl mb-1">📜</div>
                <p className="text-xs text-muted-foreground">History</p>
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
