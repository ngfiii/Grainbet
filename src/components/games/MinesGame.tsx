
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const MinesGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [board, setBoard] = useState<('hidden' | 'revealed' | 'mine')[]>(Array(25).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameResult, setGameResult] = useState('');
  const { recordGame } = useGameHistory();

  const calculateMultiplier = (revealed: number, mines: number) => {
    const safe = 25 - mines;
    if (revealed === 0) return 1;
    let mult = 1;
    for (let i = 0; i < revealed; i++) {
      mult *= (safe - i) / (25 - mines - i);
    }
    return mult;
  };

  const startGame = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    
    // Generate random mine positions
    const positions: number[] = [];
    while (positions.length < mineCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    setMinePositions(positions);
    setBoard(Array(25).fill('hidden'));
    setRevealedCount(0);
    setMultiplier(1);
    setGameState('playing');
    setGameResult('');
  };

  const revealTile = (index: number) => {
    if (board[index] !== 'hidden' || gameState !== 'playing') return;
    
    const newBoard = [...board];
    
    if (minePositions.includes(index)) {
      // Hit a mine
      newBoard[index] = 'mine';
      minePositions.forEach(pos => {
        if (newBoard[pos] === 'hidden') newBoard[pos] = 'mine';
      });
      setBoard(newBoard);
      setGameState('finished');
      setGameResult('💥 You hit a mine!');
      recordGame('mines', betAmount, 0, false, 0);
    } else {
      // Safe tile
      newBoard[index] = 'revealed';
      const newRevealedCount = revealedCount + 1;
      const newMultiplier = calculateMultiplier(newRevealedCount, mineCount);
      
      setBoard(newBoard);
      setRevealedCount(newRevealedCount);
      setMultiplier(newMultiplier);
      
      // Check if all safe tiles are revealed
      if (newRevealedCount === 25 - mineCount) {
        setGameState('finished');
        setGameResult('🎉 You found all safe tiles!');
        const payout = betAmount * newMultiplier;
        onUpdateBalance(payout);
        recordGame('mines', betAmount, payout, true, newMultiplier);
      }
    }
  };

  const cashOut = async () => {
    if (revealedCount === 0) return;
    
    const payout = betAmount * multiplier;
    onUpdateBalance(payout);
    setGameState('finished');
    setGameResult(`💰 Cashed out for ${payout.toFixed(2)} coins!`);
    await recordGame('mines', betAmount, payout, true, multiplier);
  };

  const newGame = () => {
    setGameState('betting');
    setBoard(Array(25).fill('hidden'));
    setMinePositions([]);
    setRevealedCount(0);
    setMultiplier(1);
    setGameResult('');
  };

  const renderTile = (index: number) => {
    const tile = board[index];
    return (
      <button
        key={index}
        onClick={() => revealTile(index)}
        disabled={gameState !== 'playing' || tile !== 'hidden'}
        className={cn(
          "w-12 h-12 border-2 rounded-lg font-bold text-lg transition-all",
          tile === 'hidden' && "bg-gray-600 border-gray-500 hover:bg-gray-500",
          tile === 'revealed' && "bg-green-600 border-green-500 text-white",
          tile === 'mine' && "bg-red-600 border-red-500 text-white"
        )}
      >
        {tile === 'revealed' && '💎'}
        {tile === 'mine' && '💣'}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-orange-400 mb-6 text-center">💣 Mines</h2>
        
        {gameState === 'betting' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Number of Mines</label>
              <Input
                type="number"
                value={mineCount}
                onChange={(e) => setMineCount(Math.max(1, Math.min(24, parseInt(e.target.value) || 3)))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max="24"
              />
            </div>
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3"
            >
              Start Game ({betAmount} coins)
            </Button>
          </div>
        )}

        {gameState !== 'betting' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg">Mines: {mineCount} | Revealed: {revealedCount} | Multiplier: {multiplier.toFixed(2)}x</p>
              {gameState === 'playing' && revealedCount > 0 && (
                <p className="text-green-400">Current win: {(betAmount * multiplier).toFixed(2)} coins</p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
              {Array.from({ length: 25 }, (_, i) => renderTile(i))}
            </div>

            {gameState === 'playing' && revealedCount > 0 && (
              <div className="text-center">
                <Button
                  onClick={cashOut}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2"
                >
                  Cash Out ({(betAmount * multiplier).toFixed(2)} coins)
                </Button>
              </div>
            )}

            {gameState === 'finished' && (
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold">{gameResult}</div>
                <Button
                  onClick={newGame}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2"
                >
                  New Game
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
