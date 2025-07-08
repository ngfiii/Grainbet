
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameSave } from '@/hooks/useGameSave';
import { useGameHistory } from '@/hooks/useGameHistory';


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

// Exact multiplier chart as provided by user
const MINES_MULTIPLIERS: { [mines: number]: { [gems: number]: number } } = {
  1: { 1: 1.0417, 2: 1.087, 3: 1.1364, 4: 1.1905, 5: 1.25, 6: 1.3158, 7: 1.3889, 8: 1.4706, 9: 1.5625, 10: 1.6667, 11: 1.7857, 12: 1.9231, 13: 2.0833, 14: 2.2727, 15: 2.5, 16: 2.7778, 17: 3.125, 18: 3.5714, 19: 4.1667, 20: 5.0, 21: 6.25, 22: 8.3333, 23: 12.5, 24: 25.0 },
  2: { 1: 1.087, 2: 1.1858, 3: 1.2987, 4: 1.4286, 5: 1.5789, 6: 1.7544, 7: 1.9608, 8: 2.2059, 9: 2.5, 10: 2.8571, 11: 3.2967, 12: 3.8462, 13: 4.5455, 14: 5.4545, 15: 6.6667, 16: 8.3333, 17: 10.7143, 18: 14.2857, 19: 20.0, 20: 30.0, 21: 50.0, 22: 100.0, 23: 300.0 },
  3: { 1: 1.1364, 2: 1.2987, 3: 1.4935, 4: 1.7293, 5: 2.0175, 6: 2.3736, 7: 2.8186, 8: 3.3824, 9: 4.1071, 10: 5.0549, 11: 6.3187, 12: 8.042, 13: 10.4545, 14: 13.9394, 15: 19.1667, 16: 27.381, 17: 41.0714, 18: 65.7143, 19: 115.0, 20: 230.0, 21: 575.0, 22: 2300.0 },
  4: { 1: 1.1905, 2: 1.4286, 3: 1.7293, 4: 2.1136, 5: 2.6109, 6: 3.2637, 7: 4.134, 8: 5.3151, 9: 6.9505, 10: 9.2674, 11: 12.6374, 12: 17.6923, 13: 25.5556, 14: 38.3333, 15: 60.2381, 16: 100.3968, 17: 180.7143, 18: 361.4286, 19: 843.3333, 20: 2530.0, 21: 12650.0 },
  5: { 1: 1.25, 2: 1.5789, 3: 2.0175, 4: 2.6109, 5: 3.4269, 6: 4.5691, 7: 6.201, 8: 8.586, 9: 12.1635, 10: 17.6923, 11: 26.5385, 12: 41.2821, 13: 67.0833, 14: 115.0, 15: 210.8333, 16: 421.6667, 17: 948.75, 18: 2530.0, 19: 8855.0, 20: 53130.0 },
  6: { 1: 1.3158, 2: 1.7544, 3: 2.3736, 4: 3.2637, 5: 4.5691, 6: 6.5273, 7: 9.54, 8: 14.31, 9: 22.1154, 10: 35.3846, 11: 58.9744, 12: 103.2051, 13: 191.6667, 14: 383.3333, 15: 843.3333, 16: 2108.3333, 17: 6325.0, 18: 25300.0, 19: 177100.0 },
  7: { 1: 1.3889, 2: 1.9608, 3: 2.8186, 4: 4.134, 5: 6.201, 6: 9.54, 7: 15.105, 8: 24.7172, 9: 42.0192, 10: 74.7009, 11: 140.0641, 12: 280.1282, 13: 606.9444, 14: 1456.6667, 15: 4005.8333, 16: 13352.7778, 17: 60087.5, 18: 480700.0 },
  8: { 1: 1.4706, 2: 2.2059, 3: 3.3824, 4: 5.3151, 5: 8.586, 6: 14.31, 7: 24.7172, 8: 44.491, 9: 84.0385, 10: 168.0769, 11: 360.1648, 12: 840.3846, 13: 2185.0, 14: 6555.0, 15: 24035.0, 16: 120175.0, 17: 1081575.0 },
  9: { 1: 1.5625, 2: 2.5, 3: 4.1071, 4: 6.9505, 5: 12.1635, 6: 22.1154, 7: 42.0192, 8: 84.0385, 9: 178.5817, 10: 408.1868, 11: 1020.467, 12: 2857.3077, 13: 9286.25, 14: 37145.0, 15: 204297.5, 16: 2042975.0 },
  10: { 1: 1.6667, 2: 2.8571, 3: 5.0549, 4: 9.2674, 5: 17.6923, 6: 35.3846, 7: 74.7009, 8: 168.0769, 9: 408.1868, 10: 1088.4982, 11: 3265.4945, 12: 11429.2308, 13: 49526.6667, 14: 297160.0, 15: 3268760.0 },
  11: { 1: 1.7857, 2: 3.2967, 3: 6.3187, 4: 12.6374, 5: 26.5385, 6: 58.9744, 7: 140.0641, 8: 360.1648, 9: 1020.467, 10: 3265.4945, 11: 12245.6044, 12: 57146.1538, 13: 371450.0, 14: 4457400.0 },
  12: { 1: 1.9231, 2: 3.8462, 3: 8.042, 4: 17.6923, 5: 41.2821, 6: 103.2051, 7: 280.1282, 8: 840.3846, 9: 2857.3077, 10: 11429.2308, 11: 57146.1538, 12: 400023.0769, 13: 5200300.0 },
  13: { 1: 2.0833, 2: 4.5455, 3: 10.4545, 4: 25.5556, 5: 67.0833, 6: 191.6667, 7: 606.9444, 8: 2185.0, 9: 9286.25, 10: 49526.6667, 11: 371450.0, 12: 5200300.0 },
  14: { 1: 2.2727, 2: 5.4545, 3: 13.9394, 4: 38.3333, 5: 115.0, 6: 383.3333, 7: 1456.6667, 8: 6555.0, 9: 37145.0, 10: 297160.0, 11: 4457400.0 },
  15: { 1: 2.5, 2: 6.6667, 3: 19.1667, 4: 60.2381, 5: 210.8333, 6: 843.3333, 7: 4005.8333, 8: 24035.0, 9: 204297.5, 10: 3268760.0 },
  16: { 1: 2.7778, 2: 8.3333, 3: 27.381, 4: 100.3968, 5: 421.6667, 6: 2108.3333, 7: 13352.7778, 8: 120175.0, 9: 2042975.0 },
  17: { 1: 3.125, 2: 10.7143, 3: 41.0714, 4: 180.7143, 5: 948.75, 6: 6325.0, 7: 60087.5, 8: 1081575.0 },
  18: { 1: 3.5714, 2: 14.2857, 3: 65.7143, 4: 361.4286, 5: 2530.0, 6: 25300.0, 7: 480700.0 },
  19: { 1: 4.1667, 2: 20.0, 3: 115.0, 4: 843.3333, 5: 8855.0, 6: 177100.0 },
  20: { 1: 5.0, 2: 30.0, 3: 230.0, 4: 2530.0, 5: 53130.0 },
  21: { 1: 6.25, 2: 50.0, 3: 575.0, 4: 12650.0 },
  22: { 1: 8.3333, 2: 100.0, 3: 2300.0 },
  23: { 1: 12.5, 2: 300.0 },
  24: { 1: 25.0 }
};

export const MinesGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameResult, setGameResult] = useState('');
  const [processingCells, setProcessingCells] = useState<Set<string>>(new Set());
  
  const { saveGameState, loadGameState, clearGameState } = useGameSave('mines');
  const { recordGame } = useGameHistory();

  // Initialize empty grid on component mount
  useEffect(() => {
    initializeEmptyGrid();
    loadSavedGame();
  }, []);

  const loadSavedGame = async () => {
    const savedState = await loadGameState();
    if (savedState) {
      setBetAmount(savedState.betAmount || 10);
      setMinesCount(savedState.minesCount || 3);
      setGrid(savedState.grid || []);
      setGameStatus(savedState.gameStatus || 'betting');
      setRevealedCount(savedState.revealedCount || 0);
      setCurrentMultiplier(savedState.currentMultiplier || 1);
      setGameResult(savedState.gameResult || '');
      console.log('Loaded saved Mines game');
    }
  };

  const saveCurrentGameState = async () => {
    if (gameStatus === 'playing') {
      await saveGameState({
        betAmount,
        minesCount,
        grid,
        gameStatus,
        revealedCount,
        currentMultiplier,
        gameResult
      });
    }
  };

  // Save game state whenever it changes during gameplay
  useEffect(() => {
    saveCurrentGameState();
  }, [gameStatus, grid, revealedCount, currentMultiplier]);

  // Use exact multipliers from the chart
  useEffect(() => {
    if (revealedCount > 0 && gameStatus === 'playing') {
      const multiplier = MINES_MULTIPLIERS[minesCount]?.[revealedCount] || 1;
      setCurrentMultiplier(multiplier);
      
      console.log(`🎯 MINES: ${revealedCount} gems found with ${minesCount} mines = ${multiplier}x multiplier`);
    }
  }, [revealedCount, minesCount, gameStatus]);

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

  const startGame = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    const newGrid = initializeGrid();
    setGrid(newGrid);
    setGameStatus('playing');
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
    setProcessingCells(new Set());
  };

  const revealTile = useCallback(async (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    
    // Prevent processing if cell is already being processed, revealed, or game is not in playing state
    if (gameStatus !== 'playing' || 
        grid[row]?.[col]?.revealed || 
        processingCells.has(cellKey)) {
      return;
    }
    
    // Mark cell as being processed
    setProcessingCells(prev => new Set([...prev, cellKey]));
    
    // Start animation immediately
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      if (newGrid[row] && newGrid[row][col]) {
        newGrid[row][col] = { ...newGrid[row][col], isAnimating: true };
      }
      return newGrid;
    });
    
    // Short animation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      if (!newGrid[row] || !newGrid[row][col] || newGrid[row][col].revealed) {
        return prevGrid;
      }
      
      newGrid[row][col] = {
        ...newGrid[row][col],
        revealed: true,
        isAnimating: false
      };
      
      if (newGrid[row][col].isMine) {
        // Hit a mine - game over
        setGameStatus('finished');
        setGameResult('💥 BOOM! Game Over');
        clearGameState(); // Clear saved game on game over
        recordGame('mines', betAmount, 0, false, currentMultiplier);
        
        // Reveal all mines with staggered animation
        setTimeout(() => {
          const minePositions: [number, number][] = [];
          newGrid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              if (cell.isMine && !cell.revealed) {
                minePositions.push([rowIndex, colIndex]);
              }
            });
          });
          
          minePositions.forEach(([mineRow, mineCol], index) => {
            setTimeout(() => {
              setGrid(currentGrid => {
                const updatedGrid = currentGrid.map(row => [...row]);
                if (updatedGrid[mineRow] && updatedGrid[mineRow][mineCol]) {
                  updatedGrid[mineRow][mineCol] = {
                    ...updatedGrid[mineRow][mineCol],
                    revealed: true
                  };
                }
                return updatedGrid;
              });
            }, index * 100);
          });
        }, 200);
      } else {
        // Found a gem - update revealed count
        setRevealedCount(prev => prev + 1);
      }
      
      return newGrid;
    });
    
    // Remove from processing set after a short delay
    setTimeout(() => {
      setProcessingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }, 150);
  }, [gameStatus, grid, processingCells, clearGameState]);

  const pickRandomTile = () => {
    if (gameStatus !== 'playing') return;
    
    // Find all unrevealed tiles
    const unrevealedTiles: [number, number][] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell.revealed && !processingCells.has(`${rowIndex}-${colIndex}`)) {
          unrevealedTiles.push([rowIndex, colIndex]);
        }
      });
    });
    
    if (unrevealedTiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * unrevealedTiles.length);
      const [row, col] = unrevealedTiles[randomIndex];
      revealTile(row, col);
    }
  };

  const cashOut = () => {
    if (gameStatus !== 'playing') return;
    
    const totalPayout = betAmount * currentMultiplier;
    const profit = totalPayout - betAmount;
    onUpdateBalance(totalPayout);
    setGameStatus('finished');
    setGameResult(`🎉 Cashed out for ${profit.toFixed(0)} coins profit!`);
    recordGame('mines', betAmount, totalPayout, true, currentMultiplier);
    clearGameState(); // Clear saved game on cash out
  };

  const newGame = () => {
    initializeEmptyGrid();
    setGameStatus('betting');
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameResult('');
    setProcessingCells(new Set());
    clearGameState(); // Clear any saved game state
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center font-mono">💣 Mines</h2>
        
        {gameStatus === 'betting' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 font-mono">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-mono">Number of Mines</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={minesCount}
                onChange={(e) => setMinesCount(Math.max(1, Math.min(24, parseInt(e.target.value) || 3)))}
                className="bg-gray-700 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-yellow-400 font-mono"
              />
            </div>
            
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105 font-mono"
            >
              Start Game ({betAmount} coins)
            </Button>
          </div>
        )}

        {/* Always show grid */}
        <div className="mb-6">
          {gameStatus !== 'betting' && (
            <div className="mb-4 text-center bg-gray-700/50 p-4 rounded-lg">
              <div className="text-lg font-mono">Multiplier: <span className="text-green-400 font-bold animate-pulse">{currentMultiplier.toFixed(4)}x</span></div>
              <div className="text-lg font-mono">Potential Profit: <span className="text-yellow-400 font-bold">{(betAmount * (currentMultiplier - 1)).toFixed(0)}</span> coins</div>
              <div className="text-sm text-gray-400 font-mono">Gems Found: {revealedCount} | Mines: {minesCount}</div>
            </div>
          )}

          {/* Pick Random Button */}
          {gameStatus === 'playing' && (
            <div className="mb-4 text-center">
              <Button
                onClick={pickRandomTile}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 transition-all duration-200 hover:scale-105 font-mono"
              >
                🎲 Pick Random Tile
              </Button>
            </div>
          )}

          {/* Game Grid */}
          <div className="grid grid-cols-5 gap-3 p-4 bg-gray-900/50 rounded-lg">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => revealTile(rowIndex, colIndex)}
                  disabled={gameStatus === 'betting' || gameStatus === 'finished' || cell.revealed || cell.isAnimating || processingCells.has(`${rowIndex}-${colIndex}`)}
                  className={cn(
                    "aspect-square text-3xl font-bold border-2 rounded-lg transition-all duration-200 relative overflow-hidden",
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
            className="w-full bg-green-600 hover:bg-green-700 mb-4 py-3 transition-all duration-200 hover:scale-105 animate-pulse font-mono"
          >
            Cash Out ({(betAmount * (currentMultiplier - 1)).toFixed(0)} coins profit)
          </Button>
        )}

        {/* Game Result */}
        {gameStatus === 'finished' && (
          <div className="text-center animate-fade-in">
            <div className="text-xl font-bold mb-4 animate-bounce font-mono">{gameResult}</div>
            <Button 
              onClick={newGame} 
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-3 transition-all duration-200 hover:scale-105 font-mono"
            >
              New Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
