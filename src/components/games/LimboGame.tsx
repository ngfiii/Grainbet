
import { useState, useEffect } from 'react';
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
  const [animationMultiplier, setAnimationMultiplier] = useState(0);

  const roll = async () => {
    if (betAmount < 10 || betAmount > balance) return;
    
    setIsRolling(true);
    setResult(null);
    setLastWin(null);
    setAnimationMultiplier(0);
    
    // Deduct bet
    onUpdateBalance(-betAmount);
    
    // Generate final result
    const random = Math.random();
    const rollResult = 1 / (1 - random * 0.99);
    
    // Faster animation - 0.7 seconds total
    const animationDuration = 700;
    const steps = 35; // Reduced steps for smoother performance
    const stepDuration = animationDuration / steps;
    
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const progress = i / steps;
        // Smoother easing function
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const currentValue = easedProgress * rollResult;
        setAnimationMultiplier(currentValue);
        
        if (i === steps) {
          setResult(rollResult);
          
          if (rollResult >= targetMultiplier) {
            const winAmount = betAmount * targetMultiplier;
            setLastWin(winAmount);
            onUpdateBalance(winAmount);
          }
          setIsRolling(false);
        }
      }, i * stepDuration);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🚀 Limbo</h2>
        
        {/* Bet Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount (min: 10)</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
            min={10}
          />
        </div>

        {/* Target Multiplier */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Target Multiplier</label>
          <Input
            type="number"
            step="0.01"
            min="1.01"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
          />
        </div>

        {/* Enhanced Multiplier Display */}
        <div className="mb-6 text-center bg-gradient-to-br from-gray-900 to-gray-700 p-8 rounded-xl border-2 border-gray-600 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/5 to-transparent"></div>
          
          <div className="text-9xl font-bold mb-2 font-mono relative z-10">
            {isRolling || result !== null ? (
              <span className={`transition-all duration-200 ${
                isRolling ? 'text-yellow-400 animate-pulse' : 
                result && result >= targetMultiplier ? 'text-green-400' : 'text-red-400'
              }`}>
                {(isRolling ? animationMultiplier : result || 0).toFixed(2)}x
              </span>
            ) : (
              <span className="text-gray-500">0.00x</span>
            )}
          </div>
          
          {/* Rocket effect during animation */}
          {isRolling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-bounce">🚀</div>
            </div>
          )}
        </div>

        {/* Win Chance */}
        <div className="mb-6 text-center bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div className="text-lg text-gray-300 mb-1 font-mono">
            Win Chance: {(99 / targetMultiplier).toFixed(2)}%
          </div>
          <div className="text-gray-400 font-mono">
            Potential win: {(betAmount * targetMultiplier).toFixed(0)} coins
          </div>
        </div>

        {/* Result Display */}
        {!isRolling && result !== null && (
          <div className="mb-6 text-center animate-fade-in">
            <div className={`text-2xl font-bold mb-2 transition-all duration-300 font-mono ${
              result >= targetMultiplier ? 'text-green-400 animate-bounce' : 'text-red-400'
            }`}>
              {result >= targetMultiplier ? '🎉 WIN!' : '💔 LOSE'}
            </div>
            {lastWin && (
              <div className="text-lg text-green-400 animate-pulse font-mono">
                +{lastWin.toFixed(0)} coins
              </div>
            )}
          </div>
        )}

        {/* Launch Button */}
        <Button
          onClick={roll}
          disabled={betAmount > balance || isRolling || betAmount < 10}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono"
        >
          {isRolling ? 'Launching... 🚀' : `Launch (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
