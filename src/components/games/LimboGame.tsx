
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
  const [animationNumber, setAnimationNumber] = useState(0);

  // Calculate win chance using exact RainBet formula
  const winChance = 99 / targetMultiplier;
  const winThreshold = 99 / targetMultiplier;

  const roll = async () => {
    if (betAmount < 10 || betAmount > balance) return;
    
    setIsRolling(true);
    setResult(null);
    setLastWin(null);
    setAnimationNumber(0);
    
    // Deduct bet
    onUpdateBalance(-betAmount);
    
    // Generate random number between 0.00 and 100.00 (inclusive)
    const randomNumber = Math.random() * 100;
    
    // Determine if player wins using RainBet logic
    const playerWins = randomNumber <= winThreshold;
    
    console.log('🎲 LIMBO ROLL:', {
      randomNumber: randomNumber.toFixed(4),
      winThreshold: winThreshold.toFixed(4),
      targetMultiplier,
      playerWins,
      winChance: winChance.toFixed(2) + '%'
    });
    
    // Animation - smoothly animate to the final result
    const animationDuration = 800;
    const steps = 40;
    const stepDuration = animationDuration / steps;
    
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const progress = i / steps;
        // Use easing function for smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = easedProgress * randomNumber;
        setAnimationNumber(currentValue);
        
        if (i === steps) {
          setResult(randomNumber);
          
          if (playerWins) {
            const totalPayout = betAmount * targetMultiplier;
            const profit = totalPayout - betAmount;
            setLastWin(profit);
            onUpdateBalance(totalPayout);
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
            max="1000000"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(Math.max(1.01, Math.min(1000000, parseFloat(e.target.value) || 1.01)))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
          />
        </div>

        {/* Enhanced Result Display */}
        <div className="mb-6 text-center bg-gradient-to-br from-gray-900 to-gray-700 p-8 rounded-xl border-2 border-gray-600 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/5 to-transparent"></div>
          
          <div className="text-9xl font-bold mb-2 font-mono relative z-10">
            {isRolling || result !== null ? (
              <span className={`transition-all duration-200 ${
                isRolling ? 'text-yellow-400 animate-pulse' : 
                result && result <= winThreshold ? 'text-green-400' : 'text-red-400'
              }`}>
                {(isRolling ? animationNumber : result || 0).toFixed(2)}
              </span>
            ) : (
              <span className="text-gray-500">0.00</span>
            )}
          </div>
          
          {/* Rocket effect during animation */}
          {isRolling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-bounce">🚀</div>
            </div>
          )}
        </div>

        {/* Win Chance Display */}
        <div className="mb-6 text-center bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div className="text-lg text-gray-300 mb-1 font-mono">
            Win Chance: {winChance.toFixed(2)}%
          </div>
          <div className="text-gray-400 font-mono">
            Win if roll ≤ {winThreshold.toFixed(4)}
          </div>
          <div className="text-gray-400 font-mono">
            Potential profit: {(betAmount * (targetMultiplier - 1)).toFixed(0)} coins
          </div>
        </div>

        {/* Result Display */}
        {!isRolling && result !== null && (
          <div className="mb-6 text-center animate-fade-in">
            <div className={`text-2xl font-bold mb-2 transition-all duration-300 font-mono ${
              result <= winThreshold ? 'text-green-400 animate-bounce' : 'text-red-400'
            }`}>
              {result <= winThreshold ? '🎉 WIN!' : '💔 LOSE'}
            </div>
            {lastWin && lastWin > 0 && (
              <div className="text-lg text-green-400 animate-pulse font-mono">
                +{lastWin.toFixed(0)} coins profit
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
          {isRolling ? 'Rolling... 🚀' : `Roll (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
