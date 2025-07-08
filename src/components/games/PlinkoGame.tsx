
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameHistory } from '@/hooks/useGameHistory';

interface PlinkoGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [rows, setRows] = useState(12);
  const [isDropping, setIsDropping] = useState(false);
  const [lastResult, setLastResult] = useState<{ slot: number; multiplier: number } | null>(null);
  const { recordGameResult } = useGameHistory();

  const multipliers = {
    low: {
      8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
      12: [8.4, 3, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 3, 8.4],
      16: [16, 9, 2, 1.4, 1.1, 1, 0.5, 0.3, 0.3, 0.5, 1, 1.1, 1.4, 2, 9, 16]
    },
    medium: {
      8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      12: [18, 4, 1.7, 1.1, 0.5, 0.2, 0.2, 0.2, 0.5, 1.1, 1.7, 4, 18],
      16: [33, 11, 4, 2, 1.1, 0.6, 0.4, 0.2, 0.2, 0.4, 0.6, 1.1, 2, 4, 11, 33]
    },
    high: {
      8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      12: [43, 7, 2, 0.6, 0.2, 0.1, 0.1, 0.1, 0.2, 0.6, 2, 7, 43],
      16: [58, 15, 7, 3, 0.9, 0.3, 0.1, 0.1, 0.1, 0.1, 0.3, 0.9, 3, 7, 15, 58]
    }
  };

  const dropBall = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }

    setIsDropping(true);
    onUpdateBalance(-betAmount);

    // Simulate ball dropping through pegs
    setTimeout(async () => {
      const availableMultipliers = multipliers[risk][rows as keyof typeof multipliers.low];
      const randomSlot = Math.floor(Math.random() * availableMultipliers.length);
      const multiplier = availableMultipliers[randomSlot];
      const payout = betAmount * multiplier;

      if (payout > 0) {
        onUpdateBalance(payout);
      }

      setLastResult({ slot: randomSlot, multiplier });
      setIsDropping(false);

      // Record the game result
      await recordGameResult('plinko', betAmount, payout > betAmount, payout, multiplier);

      if (payout > betAmount) {
        toast.success(`Ball landed in ${multiplier}x slot! Won ${payout.toFixed(2)} coins!`);
      } else {
        toast.error(`Ball landed in ${multiplier}x slot. ${payout > 0 ? `Won ${payout.toFixed(2)} coins.` : 'No payout.'}`);
      }
    }, 3000);
  };

  const getCurrentMultipliers = () => {
    return multipliers[risk][rows as keyof typeof multipliers.low];
  };

  const getSlotColor = (index: number, multiplier: number) => {
    if (lastResult?.slot === index) {
      return multiplier >= 1 ? 'bg-green-600' : 'bg-red-600';
    }
    
    if (multiplier >= 10) return 'bg-yellow-600';
    if (multiplier >= 2) return 'bg-blue-600';
    if (multiplier >= 1) return 'bg-gray-600';
    return 'bg-red-700';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-yellow-400 font-mono">
            🏀 Plinko
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                max={balance}
                className="bg-gray-700 border-gray-600 text-white font-mono"
                disabled={isDropping}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Level
              </label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 font-mono"
                disabled={isDropping}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rows
              </label>
              <select
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 font-mono"
                disabled={isDropping}
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={dropBall}
                disabled={isDropping || betAmount > balance || betAmount <= 0}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2"
              >
                {isDropping ? 'Dropping...' : 'Drop Ball'}
              </Button>
            </div>
          </div>

          {/* Plinko Board Visualization */}
          <div className="text-center">
            {isDropping && (
              <div className="mb-4">
                <div className="text-4xl animate-bounce">🏀</div>
                <div className="text-yellow-400 font-mono">Ball is dropping...</div>
              </div>
            )}

            {/* Pegs Visualization */}
            <div className="mb-4">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="mb-1">
                  {Array.from({ length: rowIndex + 3 }, (_, pegIndex) => (
                    <span key={pegIndex} className="inline-block w-4 h-4 bg-gray-500 rounded-full mx-1"></span>
                  ))}
                </div>
              ))}
            </div>

            {/* Multiplier Slots */}
            <div className="flex justify-center space-x-1 mb-4">
              {getCurrentMultipliers().map((multiplier, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded text-white text-sm font-bold font-mono ${getSlotColor(index, multiplier)}`}
                >
                  {multiplier}x
                </div>
              ))}
            </div>

            {lastResult && (
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-white">
                  Last Result: {lastResult.multiplier}x
                </div>
                <div className="text-sm text-gray-300">
                  Ball landed in slot {lastResult.slot + 1}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
