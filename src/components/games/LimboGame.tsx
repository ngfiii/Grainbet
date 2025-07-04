
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const LimboGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const roll = async () => {
    if (betAmount > balance) return;
    
    setIsRolling(true);
    setResult(null);
    setLastWin(null);
    
    // Deduct bet
    onUpdateBalance(-betAmount);
    
    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate result using exponential distribution similar to Limbo
    const random = Math.random();
    const rollResult = 1 / (1 - random * 0.99); // Prevents division by zero
    
    setResult(rollResult);
    
    if (rollResult >= targetMultiplier) {
      const winAmount = betAmount * targetMultiplier;
      setLastWin(winAmount);
      onUpdateBalance(winAmount);
    }
    
    setIsRolling(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🚀 Limbo</h2>
        
        {/* Bet Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        {/* Target Multiplier */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Target Multiplier</label>
          <Input
            type="number"
            step="0.01"
            min="1.01"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        {/* Win Chance */}
        <div className="mb-6 text-center">
          <div className="text-lg text-gray-400">
            Win Chance: {(99 / targetMultiplier).toFixed(2)}%
          </div>
          <div className="text-gray-400">
            Potential win: {(betAmount * targetMultiplier).toFixed(0)} coins
          </div>
        </div>

        {/* Result Display */}
        {(result !== null || isRolling) && (
          <div className="mb-6 text-center">
            <div className="text-6xl font-bold mb-2">
              {isRolling ? (
                <div className="animate-spin">🚀</div>
              ) : (
                `${result!.toFixed(2)}x`
              )}
            </div>
            {!isRolling && result !== null && (
              <>
                <div className={`text-xl font-bold ${
                  result >= targetMultiplier ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result >= targetMultiplier ? '🎉 WIN!' : '💔 LOSE'}
                </div>
                {lastWin && (
                  <div className="text-lg text-green-400">
                    +{lastWin.toFixed(0)} coins
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Roll Button */}
        <Button
          onClick={roll}
          disabled={betAmount > balance || isRolling}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
        >
          {isRolling ? 'Rolling...' : `Launch (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
