import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface Ball {
  row: number;
  col: number;
  path: number[];
}

const multipliers = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
const NUM_ROWS = 10;

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [isDropping, setIsDropping] = useState(false);
  const [ball, setBall] = useState<Ball | null>(null);
  const [result, setResult] = useState<{ multiplier: number; position: number } | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGame } = useGameHistory();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const dropBall = async () => {
    if (betAmount > balance || isDropping) return;

    setIsDropping(true);
    setResult(null);
    setLastWin(null);
    onUpdateBalance(-betAmount);

    // Simulate Plinko movement
    let path: number[] = [];
    let col = Math.floor(multipliers.length / 2);

    for (let row = 0; row < NUM_ROWS; row++) {
      const move = Math.random() < 0.5 ? -1 : 1;
      col = Math.max(0, Math.min(multipliers.length - 1, col + move));
      path.push(col);
    }

    let row = 0;
    setBall({ row, col: path[0], path });

    intervalRef.current = setInterval(() => {
      row++;
      if (row >= NUM_ROWS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalCol = path[NUM_ROWS - 1];
        const multiplier = multipliers[finalCol];
        const isWin = multiplier >= 1;
        let payout = 0;

        if (isWin) {
          payout = betAmount * multiplier;
          setLastWin(payout);
          onUpdateBalance(payout);
        }

        setResult({ multiplier, position: finalCol });
        recordGame('plinko', betAmount, payout, isWin, multiplier);
        setIsDropping(false);
        setBall(null);
        return;
      }

      setBall({ row, col: path[row], path });
    }, 200);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">🟡 Plinko</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 font-mono">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-gray-700 border-gray-600 text-white font-mono"
          />
        </div>

        <div className="mb-6 grid grid-cols-15 gap-1 text-xs font-mono">
          {multipliers.map((mult, i) => (
            <div
              key={i}
              className={`text-center p-1 rounded border text-white font-mono ${
                result && result.position === i
                  ? mult >= 1
                    ? 'bg-green-600 border-green-500 animate-pulse'
                    : 'bg-red-600 border-red-500 animate-pulse'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              {mult}x
            </div>
          ))}
        </div>

        <div className="relative h-64 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
          {ball && (
            <div
              className="absolute text-3xl"
              style={{
                left: `${(ball.col / multipliers.length) * 100}%`,
                top: `${(ball.row / NUM_ROWS) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              🟡
            </div>
          )}

          {!ball && !isDropping && (
            <div className="text-xl text-gray-400 font-mono">Ready to drop!</div>
          )}

          {isDropping && (
            <div className="text-xl text-yellow-400 font-mono animate-pulse absolute top-2 left-1/2 -translate-x-1/2">
              Dropping Ball...
            </div>
          )}

          {result && !isDropping && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
              <div
                className={`text-2xl font-bold font-mono ${
                  result.multiplier >= 1 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.multiplier}x
              </div>
              <div
                className={`text-sm font-mono ${
                  result.multiplier >= 1 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.multiplier >= 1 ? '🎉 WIN!' : '💔 LOSE!'}
              </div>
              {lastWin && (
                <div className="text-green-400 text-sm font-mono mt-1 animate-pulse">
                  +{lastWin.toFixed(0)} coins
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={dropBall}
          disabled={betAmount > balance || isDropping}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 font-mono"
        >
          {isDropping ? 'Dropping Ball... 🟡' : `Drop Ball (${betAmount} coins)`}
        </Button>
      </div>
    </div>
  );
};
