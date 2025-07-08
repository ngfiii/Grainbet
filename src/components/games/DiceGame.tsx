
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const DiceGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [rollType, setRollType] = useState<'over' | 'under'>('over');
  const [winAmount, setWinAmount] = useState(0);
  const { recordGame } = useGameHistory();

  const calculateMultiplier = () => {
    if (rollType === 'over') {
      return target >= 95 ? 95 : (99 / (99 - target));
    } else {
      return target <= 5 ? 19 : (99 / target);
    }
  };

  const rollDice = async () => {
    if (betAmount > balance) return;
    
    setIsRolling(true);
    onUpdateBalance(-betAmount);
    
    setTimeout(async () => {
      const diceResult = Math.floor(Math.random() * 100) + 1;
      setResult(diceResult);
      
      const won = rollType === 'over' ? diceResult > target : diceResult < target;
      setIsWin(won);
      
      const multiplier = calculateMultiplier();
      const payout = won ? betAmount * multiplier : 0;
      setWinAmount(payout);
      
      if (won) {
        onUpdateBalance(payout);
      }
      
      // Record game history
      await recordGame('dice', betAmount, payout, won, multiplier);
      
      setIsRolling(false);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">🎲 Dice Game</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isRolling}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Number</label>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(Math.max(1, Math.min(98, parseInt(e.target.value) || 50)))}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isRolling}
              min="1"
              max="98"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setRollType('over')}
              variant={rollType === 'over' ? 'default' : 'outline'}
              disabled={isRolling}
              className="flex-1"
            >
              Roll Over {target}
            </Button>
            <Button
              onClick={() => setRollType('under')}
              variant={rollType === 'under' ? 'default' : 'outline'}
              disabled={isRolling}
              className="flex-1"
            >
              Roll Under {target}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              Multiplier: {calculateMultiplier().toFixed(2)}x
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Potential Win: {(betAmount * calculateMultiplier()).toFixed(2)} coins
            </p>
          </div>

          <Button
            onClick={rollDice}
            disabled={isRolling || betAmount > balance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
          >
            {isRolling ? 'Rolling...' : `Roll Dice (${betAmount} coins)`}
          </Button>

          {result !== null && (
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-6xl font-mono mb-2">{result}</div>
              <div className={cn("text-xl font-bold", isWin ? "text-green-400" : "text-red-400")}>
                {isWin ? `🎉 You Won ${winAmount.toFixed(2)} coins!` : '💔 You Lost!'}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Needed to roll {rollType} {target}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
