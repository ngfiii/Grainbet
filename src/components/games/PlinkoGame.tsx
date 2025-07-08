
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const { recordGameHistory } = useGameHistory();

  // Plinko multipliers for different slots (16 slots)
  const multipliers = [1000, 130, 26, 9, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 9, 26, 130, 1000];

  const dropBall = async () => {
    if (betAmount > balance || isPlaying) return;
    
    setIsPlaying(true);
    setLastWin(null);
    setBallPath([]);
    
    onUpdateBalance(-betAmount);
    
    // Simulate ball bouncing down
    const path: number[] = [8]; // Start in middle
    let currentPos = 8;
    
    // 16 rows of pegs
    for (let row = 0; row < 16; row++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Ball can go left or right
      const direction = Math.random() < 0.5 ? -1 : 1;
      currentPos = Math.max(0, Math.min(16, currentPos + direction));
      path.push(currentPos);
      setBallPath([...path]);
    }
    
    // Calculate final result
    const finalSlot = Math.max(0, Math.min(16, currentPos));
    const multiplier = multipliers[finalSlot];
    const payout = betAmount * multiplier;
    const isWin = multiplier >= 1;
    
    if (payout > 0) {
      onUpdateBalance(payout);
      setLastWin(payout - betAmount);
    }

    // Record game history
    await recordGameHistory('plinko', betAmount, payout, isWin, multiplier);
    
    setIsPlaying(false);
  };

  const getSlotColor = (multiplier: number) => {
    if (multiplier >= 100) return 'bg-red-600 text-white';
    if (multiplier >= 10) return 'bg-orange-500 text-white';
    if (multiplier >= 2) return 'bg-yellow-500 text-black';
    if (multiplier >= 1) return 'bg-green-500 text-white';
    return 'bg-gray-600 text-white';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🟡 Plinko</h2>
        
        {!isPlaying && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        )}

        {/* Simplified Plinko Board Visual */}
        <div className="mb-6 bg-gray-900 p-4 rounded-lg">
          <div className="text-center mb-4">
            <div className="text-2xl">🟡</div>
            <div className="text-sm text-gray-400">Ball Drop Zone</div>
          </div>
          
          {/* Simplified peg visualization */}
          <div className="text-center space-y-1 mb-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex justify-center space-x-2">
                {Array.from({ length: i + 1 }, (_, j) => (
                  <div key={j} className="w-2 h-2 bg-gray-600 rounded-full"></div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Multiplier slots */}
          <div className="grid grid-cols-8 gap-1 text-xs">
            {multipliers.slice(0, 8).map((mult, i) => (
              <div key={i} className={`p-2 rounded text-center font-bold ${getSlotColor(mult)}`}>
                {mult >= 1 ? `${mult}x` : `${mult}x`}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-9 gap-1 text-xs mt-1">
            {multipliers.slice(8).map((mult, i) => (
              <div key={i} className={`p-2 rounded text-center font-bold ${getSlotColor(mult)}`}>
                {mult >= 1 ? `${mult}x` : `${mult}x`}
              </div>
            ))}
          </div>
        </div>

        {lastWin !== null && lastWin !== 0 && (
          <div className="mb-4 text-center">
            <div className={`text-xl font-bold ${lastWin > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {lastWin > 0 ? `🎉 Won ${lastWin.toFixed(0)} coins!` : '💔 Better luck next time!'}
            </div>
          </div>
        )}

        <Button
          onClick={dropBall}
          disabled={betAmount > balance || isPlaying}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
        >
          {isPlaying ? 'Ball Dropping... 🟡' : `Drop Ball (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
