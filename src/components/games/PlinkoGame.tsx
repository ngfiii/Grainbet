
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [isDropping, setIsDropping] = useState(false);
  const [result, setResult] = useState<{ multiplier: number; position: number } | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGame } = useGameHistory();

  // Plinko multipliers (left to right)
  const multipliers = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];

  const dropBall = async () => {
    if (betAmount > balance || isDropping) return;

    setIsDropping(true);
    setResult(null);
    setLastWin(null);

    onUpdateBalance(-betAmount);

    // Simulate ball dropping with weighted probability
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate result with higher probability for center positions (lower multipliers)
    const weights = [0.001, 0.01, 0.05, 0.1, 0.15, 0.2, 0.24, 0.24, 0.24, 0.2, 0.15, 0.1, 0.05, 0.01, 0.001];
    const random = Math.random();
    let cumulative = 0;
    let position = 7; // default to center

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        position = i;
        break;
      }
    }

    const multiplier = multipliers[position];
    const isWin = multiplier >= 1;
    let payout = 0;

    if (isWin) {
      payout = betAmount * multiplier;
      setLastWin(payout);
      onUpdateBalance(payout);
    }

    setResult({ multiplier, position });

    // Record the game in history
    await recordGame('plinko', betAmount, payout, isWin, multiplier);

    setIsDropping(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🟡 Plinko</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
          />
        </div>

        {/* Multiplier Display */}
        <div className="mb-6 bg-gray-750 p-4 rounded-lg">
          <div className="text-center mb-2 text-sm font-mono text-gray-300">Multipliers</div>
          <div className="grid grid-cols-15 gap-1 text-xs font-mono">
            {multipliers.map((mult, index) => (
              <div
                key={index}
                className={`text-center p-1 rounded border ${
                  result && result.position === index
                    ? mult >= 1 ? 'bg-green-600 border-green-500 text-white animate-pulse' : 'bg-red-600 border-red-500 text-white animate-pulse'
                    : mult >= 100 ? 'bg-purple-800 border-purple-600 text-purple-200'
                    : mult >= 10 ? 'bg-blue-800 border-blue-600 text-blue-200'
                    : mult >= 2 ? 'bg-yellow-800 border-yellow-600 text-yellow-200'
                    : mult >= 1 ? 'bg-green-800 border-green-600 text-green-200'
                    : 'bg-red-800 border-red-600 text-red-200'
                }`}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div className="mb-6 text-center bg-gradient-to-br from-gray-900 to-gray-700 p-8 rounded-xl border-2 border-gray-600 relative overflow-hidden min-h-[200px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/5 to-transparent"></div>
          
          {isDropping ? (
            <div className="text-center relative z-10">
              <div className="text-6xl animate-bounce mb-4">🟡</div>
              <div className="text-xl font-mono text-yellow-400 animate-pulse">Ball Dropping...</div>
            </div>
          ) : result ? (
            <div className="text-center relative z-10">
              <div className="text-4xl mb-4">🟡</div>
              <div className={`text-3xl font-bold font-mono mb-2 ${
                result.multiplier >= 1 ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.multiplier}x
              </div>
              <div className={`text-xl font-mono ${
                result.multiplier >= 1 ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.multiplier >= 1 ? '🎉 WIN!' : '💔 LOSE!'}
              </div>
              {lastWin && lastWin > 0 && (
                <div className="text-lg text-green-400 animate-pulse font-mono mt-2">
                  +{lastWin.toFixed(0)} coins
                </div>
              )}
            </div>
          ) : (
            <div className="text-center relative z-10">
              <div className="text-6xl mb-4 opacity-50">🟡</div>
              <div className="text-xl font-mono text-gray-400">Ready to drop!</div>
            </div>
          )}
        </div>

        <div className="mb-6 text-center bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div className="text-base text-gray-400 font-mono">Potential win: Up to {(betAmount * 1000).toFixed(0)} coins</div>
          <div className="text-sm text-gray-500 font-mono">Higher multipliers are rarer!</div>
        </div>

        <Button
          onClick={dropBall}
          disabled={betAmount > balance || isDropping}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono"
        >
          {isDropping ? 'Dropping Ball... 🟡' : `Drop Ball (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
