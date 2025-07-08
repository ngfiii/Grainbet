
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const LimboGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const { recordGame } = useGameHistory();

  const calculateWinChance = () => {
    return (1 / targetMultiplier) * 100;
  };

  const playGame = async () => {
    if (betAmount > balance) return;
    
    setIsPlaying(true);
    onUpdateBalance(-betAmount);
    
    setTimeout(async () => {
      // Generate random multiplier (exponential distribution for realistic limbo)
      const randomValue = Math.random();
      const crashMultiplier = 1 / (1 - randomValue);
      
      setResult(crashMultiplier);
      
      const won = crashMultiplier >= targetMultiplier;
      setIsWin(won);
      
      const payout = won ? betAmount * targetMultiplier : 0;
      setWinAmount(payout);
      
      if (won) {
        onUpdateBalance(payout);
      }
      
      // Record game history
      await recordGame('limbo', betAmount, payout, won, targetMultiplier);
      
      setIsPlaying(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">🚀 Limbo</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isPlaying}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Multiplier</label>
            <Input
              type="number"
              step="0.1"
              value={targetMultiplier}
              onChange={(e) => setTargetMultiplier(Math.max(1.1, parseFloat(e.target.value) || 2.0))}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isPlaying}
              min="1.1"
              max="1000"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              Win Chance: {calculateWinChance().toFixed(2)}%
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Potential Win: {(betAmount * targetMultiplier).toFixed(2)} coins
            </p>
          </div>

          <Button
            onClick={playGame}
            disabled={isPlaying || betAmount > balance}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
          >
            {isPlaying ? 'Flying...' : `Fly (${betAmount} coins)`}
          </Button>

          {result !== null && (
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-4xl font-mono mb-2">{result.toFixed(2)}x</div>
              <div className={cn("text-xl font-bold", isWin ? "text-green-400" : "text-red-400")}>
                {isWin ? `🎉 You Won ${winAmount.toFixed(2)} coins!` : '💥 Crashed!'}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Target: {targetMultiplier.toFixed(2)}x
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
