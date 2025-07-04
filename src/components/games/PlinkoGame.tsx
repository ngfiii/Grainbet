
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [isDropping, setIsDropping] = useState(false);
  const [ballPosition, setBallPosition] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ slot: number; multiplier: number } | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // Plinko multipliers (16 slots, center-weighted)
  const multipliers = [1000, 130, 26, 9, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 9, 26, 130, 1000];
  const ROWS = 16;

  const dropBall = async () => {
    if (betAmount > balance || isDropping) return;
    
    onUpdateBalance(-betAmount);
    setIsDropping(true);
    setLastResult(null);
    setLastWin(null);
    setBallPosition(null);
    
    // Simulate ball dropping through pegs
    let position = 8; // Start at center (position 8 out of 16)
    
    for (let row = 0; row < ROWS; row++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Random bounce left or right
      const direction = Math.random() > 0.5 ? 1 : -1;
      position = Math.max(0, Math.min(16, position + direction * (Math.random() * 0.8 + 0.2)));
      
      setBallPosition(position);
    }
    
    // Final position determines the slot
    const finalSlot = Math.round(position);
    const multiplier = multipliers[finalSlot];
    
    setLastResult({ slot: finalSlot, multiplier });
    
    const winAmount = betAmount * multiplier;
    setLastWin(winAmount);
    onUpdateBalance(winAmount);
    
    setIsDropping(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🟡 Plinko</h2>
        
        {/* Controls */}
        <div className="mb-6 max-w-md mx-auto">
          <label className="block text-sm font-medium mb-2">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white mb-4"
          />
          
          <Button
            onClick={dropBall}
            disabled={betAmount > balance || isDropping}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
          >
            {isDropping ? 'Dropping...' : `Drop Ball (${betAmount} coins)`}
          </Button>
        </div>

        {/* Plinko Board Visualization */}
        <div className="mb-6">
          <div className="relative bg-gray-900 p-6 rounded-lg border-2 border-gray-600 overflow-hidden">
            {/* Drop Zone */}
            <div className="text-center mb-4">
              <div className="inline-block w-4 h-4 bg-yellow-400 rounded-full animate-bounce">
                {isDropping && ballPosition !== null && (
                  <div 
                    className="absolute w-4 h-4 bg-red-500 rounded-full transition-all duration-150"
                    style={{ 
                      left: `${(ballPosition / 16) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Pegs representation */}
            <div className="grid grid-cols-17 gap-1 mb-4">
              {Array.from({ length: ROWS * 17 }, (_, i) => {
                const row = Math.floor(i / 17);
                const col = i % 17;
                const shouldShowPeg = (row + col) % 2 === 0 && col < 16;
                
                return (
                  <div key={i} className="h-2 flex justify-center">
                    {shouldShowPeg && (
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Multiplier Slots */}
        <div className="grid grid-cols-17 gap-1 mb-6">
          {multipliers.map((multiplier, index) => (
            <div
              key={index}
              className={cn(
                "text-center p-2 rounded text-sm font-bold",
                multiplier >= 100 
                  ? "bg-red-600 text-white" 
                  : multiplier >= 10 
                  ? "bg-orange-600 text-white"
                  : multiplier >= 2 
                  ? "bg-yellow-600 text-black"
                  : multiplier >= 1 
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white",
                lastResult?.slot === index && "ring-2 ring-yellow-400 animate-pulse"
              )}
            >
              {multiplier}x
            </div>
          ))}
        </div>

        {/* Result Display */}
        {lastResult && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">
              Ball landed in {lastResult.multiplier}x slot!
            </div>
            {lastWin && (
              <div className={cn(
                "text-xl font-bold",
                lastWin >= betAmount ? "text-green-400" : "text-red-400"
              )}>
                {lastWin >= betAmount ? '🎉 WIN: ' : '💔 LOSS: '}
                {lastWin.toFixed(0)} coins
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
