
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameHistory } from '@/hooks/useGameHistory';

interface DiceGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

const DiceGame: React.FC<DiceGameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState<'over' | 'under'>('over');
  const [target, setTarget] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<'win' | 'loss' | null>(null);
  const { recordGameResult } = useGameHistory();

  const calculateMultiplier = () => {
    if (prediction === 'over') {
      return (99 / (99 - target));
    } else {
      return (99 / target);
    }
  };

  const rollDice = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }

    setIsRolling(true);
    
    // Deduct bet amount
    onUpdateBalance(-betAmount);

    // Simulate rolling animation
    setTimeout(async () => {
      const roll = Math.floor(Math.random() * 100) + 1;
      setLastRoll(roll);

      let isWin = false;
      if (prediction === 'over' && roll > target) {
        isWin = true;
      } else if (prediction === 'under' && roll < target) {
        isWin = true;
      }

      const multiplier = calculateMultiplier();
      let payout = 0;

      if (isWin) {
        payout = betAmount * multiplier;
        onUpdateBalance(payout);
        setLastResult('win');
        toast.success(`You won ${payout.toFixed(2)} coins!`);
      } else {
        setLastResult('loss');
        toast.error('You lost!');
      }

      // Record the game result
      await recordGameResult('dice', betAmount, isWin, payout, multiplier);

      setIsRolling(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-yellow-400 font-mono">
            🎲 Dice Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dice Display */}
          <div className="text-center">
            <div className="inline-block p-8 bg-gray-700 rounded-lg border-2 border-gray-600">
              {isRolling ? (
                <div className="text-6xl animate-spin">🎲</div>
              ) : (
                <div className="text-6xl font-bold text-white font-mono">
                  {lastRoll || '?'}
                </div>
              )}
            </div>
            {lastResult && (
              <div className={`mt-2 text-lg font-bold ${
                lastResult === 'win' ? 'text-green-400' : 'text-red-400'
              }`}>
                {lastResult === 'win' ? '🎉 WIN!' : '💀 LOSS!'}
              </div>
            )}
          </div>

          {/* Game Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Number
                </label>
                <Input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  min="1"
                  max="98"
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prediction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setPrediction('over')}
                  variant={prediction === 'over' ? 'default' : 'outline'}
                  className={prediction === 'over' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Over {target}
                </Button>
                <Button
                  onClick={() => setPrediction('under')}
                  variant={prediction === 'under' ? 'default' : 'outline'}
                  className={prediction === 'under' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Under {target}
                </Button>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-300">Multiplier</div>
              <div className="text-xl font-bold text-yellow-400 font-mono">
                {calculateMultiplier().toFixed(2)}x
              </div>
            </div>

            <Button
              onClick={rollDice}
              disabled={isRolling || betAmount > balance}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiceGame;
