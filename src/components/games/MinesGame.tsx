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
  const [minesCount, setMinesCount] = useState(3);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [board, setBoard] = useState<Array<'hidden' | 'safe' | 'mine'>>([]);
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameResult, setGameResult] = useState('');
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGameHistory } = useGameHistory();

  const BOARD_SIZE = 25;

  const getMultiplier = (revealed: number, mines: number): number => {
    if (revealed === 0) return 1;
    const safeSpaces = BOARD_SIZE - mines;
    let multiplier = 1;
    
    for (let i = 0; i < revealed; i++) {
      multiplier *= (safeSpaces / (safeSpaces - i));
    }
    
    return multiplier * 0.95; // House edge
  };

  const startGame = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    
    // Generate mine positions
    const mines = new Set<number>();
    while (mines.size < minesCount) {
      mines.add(Math.floor(Math.random() * BOARD_SIZE));
    }
    
    setMinePositions(mines);
    setBoard(new Array(BOARD_SIZE).fill('hidden'));
    setGameStatus('playing');
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
    setLastWin(null);
  };

  const revealCell = (index: number) => {
    if (gameStatus !== 'playing' || board[index] !== 'hidden') return;
    
    const newBoard = [...board];
    
    if (minePositions.has(index)) {
      // Hit a mine - game over
      newBoard[index] = 'mine';
      // Reveal all mines
      minePositions.forEach(pos => {
        newBoard[pos] = 'mine';
      });
      setBoard(newBoard);
      endGame(false);
    } else {
      // Safe cell
      newBoard[index] = 'safe';
      const newRevealedCount = revealedCount + 1;
      const newMultiplier = getMultiplier(newRevealedCount, minesCount);
      
      setBoard(newBoard);
      setRevealedCount(newRevealedCount);
      setCurrentMultiplier(newMultiplier);
    }
  };

  const cashOut = () => {
    if (gameStatus !== 'playing' || revealedCount === 0) return;
    endGame(true);
  };

  const endGame = async (won: boolean) => {
    let payout = 0;
    if (won && revealedCount > 0) {
      payout = betAmount * currentMultiplier;
      setLastWin(payout - betAmount);
      onUpdateBalance(payout);
      setGameResult(`🎉 Cashed out! ${revealedCount} safe cells found!`);
    } else {
      setGameResult('💣 BOOM! You hit a mine!');
    }

    // Record game history
    await recordGameHistory('mines', betAmount, payout, won, currentMultiplier);
    
    setGameStatus('finished');
  };

  const newGame = () => {
    setGameStatus('betting');
    setBoard([]);
    setMinePositions(new Set());
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
    setLastWin(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">💣 Mines</h2>
        
        {gameStatus === 'betting' && (
          <div className="space-y-4 mb-6">
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
              <label className="block text-sm font-medium mb-2">Number of Mines (1-24)</label>
              <Input
                type="number"
                min={1}
                max={24}
                value={minesCount}
                onChange={(e) => setMinesCount(Math.max(1, Math.min(24, parseInt(e.target.value) || 3)))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        )}

        {gameStatus !== 'betting' && (
          <div className="mb-6 text-center">
            <div className="text-lg mb-2">
              Revealed: {revealedCount} | Multiplier: {currentMultiplier.toFixed(2)}x
            </div>
            <div className="text-sm text-gray-400">
              Potential win: {(betAmount * currentMultiplier).toFixed(2)} coins
            </div>
          </div>
        )}

        {/* Game Board */}
        {gameStatus !== 'betting' && (
          <div className="grid grid-cols-5 gap-2 mb-6 max-w-lg mx-auto">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => revealCell(index)}
                disabled={gameStatus !== 'playing'}
                className={cn(
                  "aspect-square text-2xl font-bold border-2 rounded-lg transition-all",
                  cell === 'hidden' && gameStatus === 'playing'
                    ? "bg-gray-600 border-gray-500 hover:bg-gray-500 cursor-pointer"
                    : cell === 'safe'
                    ? "bg-green-600 border-green-500 text-white"
                    : cell === 'mine'
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-gray-700 border-gray-600 cursor-not-allowed"
                )}
              >
                {cell === 'safe' ? '💎' : cell === 'mine' ? '💣' : ''}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        {gameStatus === 'betting' && (
          <Button
            onClick={startGame}
            disabled={betAmount > balance}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
          >
            Start Game ({betAmount} coins)
          </Button>
        )}

        {gameStatus === 'playing' && (
          <div className="flex gap-2">
            <Button
              onClick={cashOut}
              disabled={revealedCount === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold py-3"
            >
              Cash Out ({(betAmount * currentMultiplier).toFixed(2)} coins)
            </Button>
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">{gameResult}</div>
            {lastWin && lastWin > 0 && (
              <div className="text-lg text-green-400 mb-4">
                +{lastWin.toFixed(0)} coins profit
              </div>
            )}
            <Button onClick={newGame} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
              New Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
