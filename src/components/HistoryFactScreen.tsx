import { HistoricalFact } from "@/game/gameData";

interface HistoryFactScreenProps {
  fact: HistoricalFact;
  won: boolean;
  onContinue: () => void;
  onFightAgain: () => void;
}

const HistoryFactScreen = ({ fact, won, onContinue, onFightAgain }: HistoryFactScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="text-6xl mb-2">{won ? "🏆" : "📜"}</div>
        
        <h2 className="font-display font-bold text-2xl gold-gradient-text">
          {won ? "Victory! Learn from the past..." : "Defeat! But knowledge endures..."}
        </h2>

        <div className="card-battle p-6 space-y-4">
          <div className="space-y-2">
            <p className="font-display text-xs text-primary tracking-widest uppercase">Historical Fact</p>
            <p className="text-foreground text-base leading-relaxed">{fact.fact}</p>
          </div>
          
          <div className="border-t border-border pt-4 space-y-2">
            <p className="font-display text-xs text-accent tracking-widest uppercase">Lesson From History</p>
            <p className="text-muted-foreground text-sm italic leading-relaxed">"{fact.lesson}"</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onFightAgain} className="btn-attack">
            ⚔️ Fight Again
          </button>
          <button onClick={onContinue} className="btn-gold">
            📜 New Battle
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryFactScreen;
