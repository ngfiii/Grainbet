
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const DiceGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetNumber, setTargetNumber] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGame } = useGameHistory();

  const winChance = rollOver ? (100 - targetNumber) : (targetNumber - 1);
  const multiplier = Math.max(1.01, 99 / winChance);

  const roll = async () => {
    if (betAmount > balance || isRolling) return;

    setIsRolling(true);
    setResult(null);
    setLastWin(null);

    onUpdateBalance(-betAmount);

    // Simulate rolling animation
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setResult(Math.floor(Math.random() * 100) + 1);
    }

    const finalResult = Math.floor(Math.random() * 100) + 1;
    setResult(finalResult);

    const isWin = rollOver ? finalResult > targetNumber : finalResult < targetNumber;
    
    let payout = 0;
    if (isWin) {
      payout = betAmount * multiplier;
      setLastWin(payout);
      onUpdateBalance(payout);
    }

    // Record the game in history
    await recordGame('dice', betAmount, payout, isWin, isWin ? multiplier : undefined);

    setIsRolling(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🎲 Dice</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Target Number</label>
          <Input
            type="number"
            min="2"
            max="98"
            value={targetNumber}
            onChange={(e) => setTargetNumber(Math.max(2, Math.min(98, parseInt(e.target.value) || 50)))}
            className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
          />
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setRollOver(true)}
            variant={rollOver ? "default" : "outline"}
            className={`flex-1 font-mono transition-all duration-200 ${
              rollOver ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'
            }`}
          >
            Roll Over {targetNumber}
          </Button>
          <Button
            onClick={() => setRollOver(false)}
            variant={!rollOver ? "default" : "outline"}
            className={`flex-1 font-mono transition-all duration-200 ${
              !rollOver ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
            }`}
          >
            Roll Under {targetNumber}
          </Button>
        </div>

        <div className="mb-6 text-center bg-gradient-to-br from-gray-900 to-gray-700 p-8 rounded-xl border-2 border-gray-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/5 to-transparent"></div>
          <div className="text-6xl font-bold mb-2 font-mono relative z-10">
            {result !== null ? (
              <span className={`transition-all duration-300 ${
                result !== null && ((rollOver && result > targetNumber) || (!rollOver && result < targetNumber))
                  ? 'text-green-400 animate-bounce' 
                  : result !== null 
                  ? 'text-red-400' 
                  : 'text-yellow-400'
              }`}>
                {result}
              </span>
            ) : (
              <span className="text-gray-500">?</span>
            )}
          </div>
          
          {isRolling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-spin">🎲</div>
            </div>
          )}
        </div>

        <div className="mb-6 text-center bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div className="text-lg text-gray-300 mb-1 font-mono">Win Chance: {winChance.toFixed(2)}%</div>
          <div className="text-base text-gray-400 font-mono">Multiplier: {multiplier.toFixed(2)}x</div>
          <div className="text-base text-gray-400 font-mono">Potential win: {(betAmount * multiplier).toFixed(0)} coins</div>
        </div>

        {!isRolling && result !== null && (
          <div className="mb-6 text-center animate-fade-in">
            <div
              className={`text-2xl font-bold mb-2 transition-all duration-300 font-mono ${
                (rollOver && result > targetNumber) || (!rollOver && result < targetNumber)
                  ? 'text-green-400 animate-bounce' 
                  : 'text-red-400'
              }`}
            >
              {(rollOver && result > targetNumber) || (!rollOver && result < targetNumber) ? '🎉 WIN!' : '💔 LOSE!'}
            </div>
            {lastWin && lastWin > 0 && (
              <div className="text-lg text-green-400 animate-pulse font-mono">+{lastWin.toFixed(0)} coins</div>
            )}
          </div>
        )}

        <Button
          onClick={roll}
          disabled={betAmount > balance || isRolling}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono"
        >
          {isRolling ? 'Rolling... 🎲' : `Roll Dice (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
