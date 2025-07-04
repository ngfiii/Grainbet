
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const MinesGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [grid, setGrid] = useState<Array<Array<{ revealed: boolean; isMine: boolean; hasGem: boolean }>>>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameResult, setGameResult] = useState('');

  const initializeGrid = () => {
    const newGrid = Array(5).fill(null).map(() =>
      Array(5).fill(null).map(() => ({ revealed: false, isMine: false, hasGem: false }))
    );

    // Place mines randomly
    const minePositions = new Set<string>();
    while (minePositions.size < minesCount) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      minePositions.add(`${row}-${col}`);
    }

    minePositions.forEach(pos => {
      const [row, col] = pos.split('-').map(Number);
      newGrid[row][col].isMine = true;
    });

    // Place gems in remaining spots
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (!newGrid[i][j].isMine) {
          newGrid[i][j].hasGem = true;
        }
      }
    }

    return newGrid;
  };

  const calculateMultiplier = (revealed: number, mines: number) => {
    const safeSpots = 25 - mines;
    if (revealed === 0) return 1;
    
    let multiplier = 1;
    for (let i = 0; i < revealed; i++) {
      multiplier *= (safeSpots - i) / (25 - mines - i);
    }
    return multiplier;
  };

  const startGame = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    const newGrid = initializeGrid();
    setGrid(newGrid);
    setGameStatus('playing');
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
  };

  const revealTile = (row: number, col: number) => {
    if (gameStatus !== 'playing' || grid[row][col].revealed) return;
    
    const newGrid = [...grid];
    newGrid[row][col].revealed = true;
    setGrid(newGrid);
    
    if (newGrid[row][col].isMine) {
      // Hit a mine - game over
      setGameStatus('finished');
      setGameResult('💣 BOOM! Game Over');
      
      // Reveal all mines
      newGrid.forEach(row => {
        row.forEach(cell => {
          if (cell.isMine) cell.revealed = true;
        });
      });
      setGrid(newGrid);
    } else {
      // Found a gem
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);
      const newMultiplier = calculateMultiplier(newRevealedCount, minesCount);
      setCurrentMultiplier(newMultiplier);
    }
  };

  const cashOut = () => {
    if (gameStatus !== 'playing') return;
    
    const winAmount = betAmount * currentMultiplier;
    onUpdateBalance(winAmount);
    setGameStatus('finished');
    setGameResult(`🎉 Cashed out for ${winAmount.toFixed(0)} coins!`);
  };

  const newGame = () => {
    setGrid([]);
    setGameStatus('betting');
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
  };

  return (
    <div className="max-w-2xl mx-auto">
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
              <label className="block text-sm font-medium mb-2">Number of Mines</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={minesCount}
                onChange={(e) => setMinesCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 3)))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
            >
              Start Game ({betAmount} coins)
            </Button>
          </div>
        )}

        {gameStatus !== 'betting' && (
          <>
            {/* Game Stats */}
            <div className="mb-4 text-center">
              <div className="text-lg">Multiplier: <span className="text-green-400 font-bold">{currentMultiplier.toFixed(2)}x</span></div>
              <div className="text-lg">Potential Win: <span className="text-yellow-400 font-bold">{(betAmount * currentMultiplier).toFixed(0)}</span> coins</div>
              <div className="text-sm text-gray-400">Gems Found: {revealedCount} | Mines: {minesCount}</div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => revealTile(rowIndex, colIndex)}
                    disabled={gameStatus !== 'playing'}
                    className={cn(
                      "aspect-square text-2xl font-bold border-2 rounded-lg transition-all",
                      cell.revealed
                        ? cell.isMine
                          ? "bg-red-600 border-red-500"
                          : "bg-green-600 border-green-500"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    )}
                  >
                    {cell.revealed ? (cell.isMine ? '💣' : '💎') : ''}
                  </button>
                ))
              )}
            </div>

            {/* Game Controls */}
            {gameStatus === 'playing' && revealedCount > 0 && (
              <Button
                onClick={cashOut}
                className="w-full bg-green-600 hover:bg-green-700 mb-4"
              >
                Cash Out ({(betAmount * currentMultiplier).toFixed(0)} coins)
              </Button>
            )}

            {/* Game Result */}
            {gameStatus === 'finished' && (
              <div className="text-center">
                <div className="text-xl font-bold mb-4">{gameResult}</div>
                <Button onClick={newGame} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                  New Game
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
