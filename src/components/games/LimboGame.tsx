
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameHistory } from '@/hooks/useGameHistory';

interface LimboGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const LimboGame: React.FC<LimboGameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [result, setResult] = useState<'win' | 'loss' | null>(null);
  const { recordGameResult } = useGameHistory();

  const calculateWinChance = () => {
    return (1 / targetMultiplier) * 100;
  };

  const playLimbo = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }

    setIsPlaying(true);
    onUpdateBalance(-betAmount);

    // Generate crash point using exponential distribution
    const randomValue = Math.random();
    const crash = Math.max(1.01, 1 / (1 - randomValue * 0.99));
    
    setTimeout(async () => {
      setCrashPoint(crash);
      
      const isWin = crash >= targetMultiplier;
      let payout = 0;

      if (isWin) {
        payout = betAmount * targetMultiplier;
        onUpdateBalance(payout);
        setResult('win');
        toast.success(`You won ${payout.toFixed(2)} coins!`);
      } else {
        setResult('loss');
        toast.error(`Crashed at ${crash.toFixed(2)}x!`);
      }

      // Record the game result
      await recordGameResult('limbo', betAmount, isWin, payout, targetMultiplier);

      setIsPlaying(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-yellow-400 font-mono">
            🚀 Limbo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Display */}
          <div className="text-center">
            <div className="inline-block p-8 bg-gray-700 rounded-lg border-2 border-gray-600">
              {isPlaying ? (
                <div className="text-4xl animate-pulse">🚀</div>
              ) : (
                <div className="space-y-2">
                  {crashPoint && (
                    <div className="text-4xl font-bold text-white font-mono">
                      {crashPoint.toFixed(2)}x
                    </div>
                  )}
                  {result && (
                    <div className={`text-lg font-bold ${
                      result === 'win' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result === 'win' ? '🎉 WIN!' : '💥 CRASHED!'}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                  Target Multiplier
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(Number(e.target.value))}
                  min="1.01"
                  max="1000"
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-300">Win Chance</div>
                <div className="text-lg font-bold text-green-400 font-mono">
                  {calculateWinChance().toFixed(2)}%
                </div>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-300">Potential Win</div>
                <div className="text-lg font-bold text-yellow-400 font-mono">
                  {(betAmount * targetMultiplier).toFixed(2)}
                </div>
              </div>
            </div>

            <Button
              onClick={playLimbo}
              disabled={isPlaying || betAmount > balance}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
            >
              {isPlaying ? 'Flying...' : 'Launch Rocket'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
