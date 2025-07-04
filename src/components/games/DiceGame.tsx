
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
    if (betAmount > balance) return;
    
    setIsRolling(true);
    setResult(null);
    setLastWin(null);
    
    // Deduct bet
    onUpdateBalance(-betAmount);
    
    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const rollResult = Math.random() * 100;
    setResult(rollResult);
    
    const won = isOver ? rollResult > target[0] : rollResult < target[0];
    
    if (won) {
      const winAmount = betAmount * calculateMultiplier();
      setLastWin(winAmount);
      onUpdateBalance(winAmount);
    }
    
    setIsRolling(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🎮 Dice</h2>
        
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

        {/* Target Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Target: {target[0].toFixed(1)}
          </label>
          <Slider
            value={target}
            onValueChange={setTarget}
            max={99}
            min={1}
            step={0.1}
            className="mb-4"
          />
        </div>

        {/* Over/Under Toggle */}
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setIsOver(false)}
            variant={!isOver ? "default" : "outline"}
            className="flex-1"
          >
            Under {target[0].toFixed(1)}
          </Button>
          <Button
            onClick={() => setIsOver(true)}  
            variant={isOver ? "default" : "outline"}
            className="flex-1"
          >
            Over {target[0].toFixed(1)}
          </Button>
        </div>

        {/* Multiplier Display */}
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-green-400">
            {calculateMultiplier().toFixed(2)}x multiplier
          </div>
          <div className="text-gray-400">
            Potential win: {(betAmount * calculateMultiplier()).toFixed(0)} coins
          </div>
        </div>

        {/* Roll Result */}
        {(result !== null || isRolling) && (
          <div className="mb-6 text-center">
            <div className="text-6xl font-bold mb-2">
              {isRolling ? '🎲' : result!.toFixed(1)}
            </div>
            {!isRolling && result !== null && (
              <div className={`text-xl font-bold ${
                (isOver ? result > target[0] : result < target[0]) 
                  ? 'text-green-400' : 'text-red-400'
              }`}>
                {(isOver ? result > target[0] : result < target[0]) ? '🎉 WIN!' : '💔 LOSE'}
              </div>
            )}
            {lastWin && (
              <div className="text-lg text-green-400">
                +{lastWin.toFixed(0)} coins
              </div>
            )}
          </div>
        )}

        {/* Roll Button */}
        <Button
          onClick={roll}
          disabled={betAmount > balance || isRolling}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
        >
          {isRolling ? 'Rolling...' : `Roll Dice (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
