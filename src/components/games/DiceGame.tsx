import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const DiceGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState([50]);
  const [isOver, setIsOver] = useState(true);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const calculateMultiplier = () => {
    const targetNum = target[0];
    if (isOver) {
      return targetNum >= 95 ? 1.01 : 99 / (100 - targetNum);
    } else {
      return targetNum <= 5 ? 1.01 : 99 / targetNum;
    }
  };

  const roll = async () => {
    if (betAmount < 10) {
      return;
    }
    if (betAmount > balance) return;
    
    setIsRolling(true);
    setLastWin(null);
    
    // Deduct bet
    onUpdateBalance(-betAmount);
    
    // Faster rolling animation - reduced from 1000ms to 300ms
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const rollResult = Math.random() * 100;
    setResult(rollResult);
    
    const won = isOver ? rollResult > target[0] : rollResult < target[0];
    
    if (won) {
      const multiplier = calculateMultiplier();
      const profit = betAmount * (multiplier - 1); // Only the profit, not the original bet
      setLastWin(profit);
      onUpdateBalance(profit);
    }
    
    setIsRolling(false);
  };

  const getResultColor = () => {
    if (result === null) return 'bg-yellow-400';
    const won = isOver ? result > target[0] : result < target[0];
    return won ? 'bg-green-400' : 'bg-red-400';
  };

  const getDisplayNumber = () => {
    return result !== null ? result : target[0];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🎮 Dice</h2>
        
        {/* Bet Amount - Moved to top */}
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

        {/* Hexagon Indicator with connecting line */}
        <div className="mb-8 relative">
          <div className="h-24 relative">
            {/* Faded Connecting Line */}
            <div 
              className="absolute top-16 w-0.5 h-8 bg-gray-400/20 transition-all duration-150 ease-out"
              style={{ 
                left: `${getDisplayNumber()}%`,
                transform: 'translateX(-50%)'
              }}
            />
            
            {/* Proper 6-sided Hexagon */}
            <div 
              className={`absolute top-0 w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-150 ease-out ${getResultColor()}`}
              style={{ 
                left: `${getDisplayNumber()}%`,
                transform: 'translateX(-50%)',
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
              }}
            >
              <span className="text-sm font-bold text-black font-mono">
                {getDisplayNumber().toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Slider with better spacing */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-4 font-mono">
            Target: {target[0].toFixed(1)}
          </label>
          
          <div className="relative mb-8">
            <div className="bg-gray-700/80 h-20 rounded-lg relative overflow-hidden border border-gray-600">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30"></div>
              
              {/* Target Range Visualization */}
              <div 
                className={`absolute top-0 h-full transition-all duration-200 ${
                  isOver ? 'bg-green-500/40' : 'bg-red-500/40'
                } border-l-2 border-r-2 ${
                  isOver ? 'border-green-400' : 'border-red-400'
                }`}
                style={{
                  left: isOver ? `${target[0]}%` : '0%',
                  width: isOver ? `${100 - target[0]}%` : `${target[0]}%`
                }}
              />
              
              {/* Target Line */}
              <div 
                className="absolute top-0 w-1 h-full bg-yellow-400 shadow-lg transition-all duration-200"
                style={{ left: `${target[0]}%` }}
              />
              
              {/* More number markers for better spacing */}
              <div className="absolute bottom-2 left-2 text-xs text-white font-mono font-bold">0</div>
              <div className="absolute bottom-2 left-[12.5%] transform -translate-x-1/2 text-xs text-white font-mono font-bold">12.5</div>
              <div className="absolute bottom-2 left-1/4 transform -translate-x-1/2 text-xs text-white font-mono font-bold">25</div>
              <div className="absolute bottom-2 left-[37.5%] transform -translate-x-1/2 text-xs text-white font-mono font-bold">37.5</div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white font-mono font-bold">50</div>
              <div className="absolute bottom-2 left-[62.5%] transform -translate-x-1/2 text-xs text-white font-mono font-bold">62.5</div>
              <div className="absolute bottom-2 left-3/4 transform -translate-x-1/2 text-xs text-white font-mono font-bold">75</div>
              <div className="absolute bottom-2 left-[87.5%] transform -translate-x-1/2 text-xs text-white font-bold">87.5</div>
              <div className="absolute bottom-2 right-2 text-xs text-white font-mono font-bold">100</div>
            </div>
            
            <div className="mt-6">
              <Slider
                value={target}
                onValueChange={setTarget}
                max={99}
                min={1}
                step={0.1}
                className="slider-enhanced cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Over/Under Toggle */}
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setIsOver(false)}
            variant={!isOver ? "default" : "outline"}
            className={`flex-1 transition-all duration-200 font-mono ${
              !isOver ? 'bg-red-500 hover:bg-red-600 text-black font-bold' : 'hover:bg-gray-700'
            }`}
          >
            <span className="text-black">Under {target[0].toFixed(1)}</span>
          </Button>
          <Button
            onClick={() => setIsOver(true)}  
            variant={isOver ? "default" : "outline"}
            className={`flex-1 transition-all duration-200 font-mono ${
              isOver ? 'bg-green-500 hover:bg-green-600 text-black font-bold' : 'hover:bg-gray-700'
            }`}
          >
            <span className="text-black">Over {target[0].toFixed(1)}</span>
          </Button>
        </div>

        {/* Multiplier Display */}
        <div className="mb-6 text-center bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
            {calculateMultiplier().toFixed(2)}x multiplier
          </div>
          <div className="text-gray-400 font-mono">
            Potential profit: {(betAmount * (calculateMultiplier() - 1)).toFixed(0)} coins
          </div>
        </div>

        {/* Roll Result */}
        {(result !== null || isRolling) && (
          <div className="mb-6 text-center animate-fade-in">
            <div className="text-6xl font-bold mb-2 transition-all duration-500 font-mono">
              {isRolling ? '🎲' : result!.toFixed(1)}
            </div>
            {!isRolling && result !== null && (
              <div className={`text-xl font-bold transition-all duration-300 font-mono ${
                (isOver ? result > target[0] : result < target[0]) 
                  ? 'text-green-400 animate-pulse' : 'text-red-400'
              }`}>
                {(isOver ? result > target[0] : result < target[0]) ? '🎉 WIN!' : '💔 LOSE'}
              </div>
            )}
            {lastWin && (
              <div className="text-lg text-green-400 animate-bounce font-mono">
                +{lastWin.toFixed(0)} coins profit
              </div>
            )}
          </div>
        )}

        {/* Roll Button */}
        <Button
          onClick={roll}
          disabled={betAmount > balance || isRolling || betAmount < 10}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono"
        >
          {isRolling ? 'Rolling...' : `Roll Dice (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
