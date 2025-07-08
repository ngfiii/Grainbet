
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const DiceGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState<'under' | 'over'>('under');
  const [targetNumber, setTargetNumber] = useState(50);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGameHistory } = useGameHistory();

  const winChance = prediction === 'under' 
    ? Math.max(1, targetNumber - 1) 
    : Math.max(1, 100 - targetNumber);
  
  const multiplier = Math.max(1.01, (99 / winChance));

  const rollDice = async () => {
    if (betAmount > balance) return;
    
    setIsRolling(true);
    setResult(null);
    setLastWin(null);
    
    onUpdateBalance(-betAmount);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const diceRoll = Math.floor(Math.random() * 100) + 1;
    setResult(diceRoll);
    
    const isWin = prediction === 'under' 
      ? diceRoll < targetNumber 
      : diceRoll > targetNumber;
    
    let payout = 0;
    if (isWin) {
      payout = betAmount * multiplier;
      setLastWin(payout - betAmount);
      onUpdateBalance(payout);
    }

    // Record game history
    await recordGameHistory('dice', betAmount, payout, isWin, multiplier);
    
    setIsRolling(false);
  };

  const getDiceIcon = () => {
    if (!result) return <Dice1 size={64} className="text-yellow-400" />;
    
    if (result <= 16) return <Dice1 size={64} className="text-yellow-400" />;
    if (result <= 33) return <Dice2 size={64} className="text-yellow-400" />;
    if (result <= 50) return <Dice3 size={64} className="text-yellow-400" />;
    if (result <= 66) return <Dice4 size={64} className="text-yellow-400" />;
    if (result <= 83) return <Dice5 size={64} className="text-yellow-400" />;
    return <Dice6 size={64} className="text-yellow-400" />;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🎲 Dice</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Prediction</label>
          <div className="flex gap-2">
            <Button
              onClick={() => setPrediction('under')}
              variant={prediction === 'under' ? 'default' : 'outline'}
              className="flex-1"
            >
              Under
            </Button>
            <Button
              onClick={() => setPrediction('over')}
              variant={prediction === 'over' ? 'default' : 'outline'}
              className="flex-1"
            >
              Over
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Target Number: {targetNumber}
          </label>
          <Input
            type="range"
            min="2"
            max="98"
            value={targetNumber}
            onChange={(e) => setTargetNumber(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-6 text-center bg-gray-700 p-4 rounded-lg">
          <div className="mb-4">
            {getDiceIcon()}
          </div>
          <div className="text-2xl font-bold mb-2">
            {isRolling ? 'Rolling...' : result !== null ? result : '?'}
          </div>
          <div className="text-sm text-gray-400">
            Win Chance: {winChance.toFixed(1)}% | Multiplier: {multiplier.toFixed(2)}x
          </div>
        </div>

        {!isRolling && result !== null && (
          <div className="mb-6 text-center">
            <div className={`text-xl font-bold mb-2 ${
              lastWin !== null && lastWin > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastWin !== null && lastWin > 0 ? '🎉 WIN!' : '💔 LOSS!'}
            </div>
            {lastWin !== null && lastWin > 0 && (
              <div className="text-lg text-green-400">+{lastWin.toFixed(0)} coins</div>
            )}
          </div>
        )}

        <Button
          onClick={rollDice}
          disabled={betAmount > balance || isRolling}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
        >
          {isRolling ? 'Rolling... 🎲' : `Roll Dice (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
