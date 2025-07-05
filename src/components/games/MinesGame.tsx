
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface Cell {
  revealed: boolean;
  isMine: boolean;
  hasGem: boolean;
  isAnimating: boolean;
}

export const MinesGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameResult, setGameResult] = useState('');

  // Initialize empty grid on component mount
  useEffect(() => {
    initializeEmptyGrid();
  }, []);

  // Update multiplier when revealed count or mines count changes - using PROPER Rainbet formula
  useEffect(() => {
    if (revealedCount > 0) {
      const newMultiplier = calculateMultiplier(revealedCount, minesCount);
      setCurrentMultiplier(newMultiplier);
    }
  }, [revealedCount, minesCount]);

  const initializeEmptyGrid = () => {
    const emptyGrid = Array(5).fill(null).map(() =>
      Array(5).fill(null).map((): Cell => ({ 
        revealed: false, 
        isMine: false, 
        hasGem: false,
        isAnimating: false
      }))
    );
    setGrid(emptyGrid);
  };

  const initializeGrid = () => {
    const newGrid: Cell[][] = Array(5).fill(null).map(() =>
      Array(5).fill(null).map((): Cell => ({ 
        revealed: false, 
        isMine: false, 
        hasGem: false,
        isAnimating: false
      }))
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

  // PROPER Rainbet-style multiplier calculation
  const calculateMultiplier = (safeClicks: number, mines: number) => {
    if (safeClicks === 0) return 1;
    
    const totalTiles = 25;
    const safeTiles = totalTiles - mines;
    const houseEdge = 0.01; // 1% house edge
    
    // Calculate survival probability step by step
    let chance = 1;
    for (let i = 0; i < safeClicks; i++) {
      const safeRemaining = safeTiles - i;
      const tilesRemaining = totalTiles - i;
      chance *= safeRemaining / tilesRemaining;
    }
    
    // Final multiplier = inverse of chance × (1 - house edge)
    const multiplier = (1 / chance) * (1 - houseEdge);
    
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

  const revealTile = async (row: number, col: number) => {
    if (gameStatus !== 'playing' || grid[row][col].revealed || grid[row][col].isAnimating) return;
    
    // Start animation
    const newGrid = [...grid];
    newGrid[row][col].isAnimating = true;
    setGrid(newGrid);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    newGrid[row][col].revealed = true;
    newGrid[row][col].isAnimating = false;
    setGrid(newGrid);
    
    if (newGrid[row][col].isMine) {
      // Hit a mine - game over
      setGameStatus('finished');
      setGameResult('💥 BOOM! Game Over');
      
      // Reveal all mines with staggered animation
      const minePositions: [number, number][] = [];
      newGrid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell.isMine) {
            minePositions.push([rowIndex, colIndex]);
          }
        });
      });
      
      minePositions.forEach(([mineRow, mineCol], index) => {
        setTimeout(() => {
          const updatedGrid = [...grid];
          updatedGrid[mineRow][mineCol].revealed = true;
          setGrid([...updatedGrid]);
        }, index * 150);
      });
    } else {
      // Found a gem
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);
    }
  };

  const cashOut = () => {
    if (gameStatus !== 'playing') return;
    
    const profit = betAmount * (currentMultiplier - 1); // Only the profit
    onUpdateBalance(profit); // Only add the profit
    setGameStatus('finished');
    setGameResult(`🎉 Cashed out for ${profit.toFixed(0)} coins profit!`);
  };

  const newGame = () => {
    initializeEmptyGrid();
    setGameStatus('betting');
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">💣 Mines</h2>
        
        {gameStatus === 'betting' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400"
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
                className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105"
            >
              Start Game ({betAmount} coins)
            </Button>
          </div>
        )}

        {/* Always show grid */}
        <div className="mb-6">
          {gameStatus !== 'betting' && (
            <div className="mb-4 text-center bg-gray-700/50 p-4 rounded-lg">
              <div className="text-lg">Multiplier: <span className="text-green-400 font-bold animate-pulse">{currentMultiplier.toFixed(2)}x</span></div>
              <div className="text-lg">Potential Profit: <span className="text-yellow-400 font-bold">{(betAmount * (currentMultiplier - 1)).toFixed(0)}</span> coins</div>
              <div className="text-sm text-gray-400">Gems Found: {revealedCount} | Mines: {minesCount}</div>
            </div>
          )}

          {/* Game Grid */}
          <div className="grid grid-cols-5 gap-3 p-4 bg-gray-900/50 rounded-lg">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => revealTile(rowIndex, colIndex)}
                  disabled={gameStatus === 'betting' || gameStatus === 'finished' || cell.isAnimating}
                  className={cn(
                    "aspect-square text-3xl font-bold border-2 rounded-lg transition-all duration-300 relative overflow-hidden",
                    cell.isAnimating && "animate-pulse scale-110",
                    cell.revealed
                      ? cell.isMine
                        ? "bg-red-600 border-red-500 shadow-lg shadow-red-500/50"
                        : "bg-green-600 border-green-500 shadow-lg shadow-green-500/50"
                      : gameStatus === 'betting'
                      ? "bg-gray-600 border-gray-500 cursor-not-allowed opacity-50"
                      : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:scale-105 cursor-pointer"
                  )}
                >
                  {cell.revealed ? (
                    cell.isMine ? (
                      <span className="text-4xl animate-bounce">💣</span>
                    ) : (
                      <span className="text-4xl animate-spin-slow">💎</span>
                    )
                  ) : cell.isAnimating ? (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
                  ) : (
                    ''
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Game Controls */}
        {gameStatus === 'playing' && revealedCount > 0 && (
          <Button
            onClick={cashOut}
            className="w-full bg-green-600 hover:bg-green-700 mb-4 py-3 transition-all duration-200 hover:scale-105 animate-pulse"
          >
            Cash Out ({(betAmount * (currentMultiplier - 1)).toFixed(0)} coins profit)
          </Button>
        )}

        {/* Game Result */}
        {gameStatus === 'finished' && (
          <div className="text-center animate-fade-in">
            <div className="text-xl font-bold mb-4 animate-bounce">{gameResult}</div>
            <Button 
              onClick={newGame} 
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-3 transition-all duration-200 hover:scale-105"
            >
              New Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
