
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameHistory } from '@/hooks/useGameHistory';

interface MinesGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const MinesGame: React.FC<MinesGameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [board, setBoard] = useState<Array<'hidden' | 'gem' | 'mine' | 'revealed'>>([]);
  const [mines, setMines] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const { recordGameResult } = useGameHistory();

  const BOARD_SIZE = 25;

  const calculateMultiplier = (revealed: number, totalMines: number) => {
    const safeSpots = BOARD_SIZE - totalMines;
    let multiplier = 1;
    for (let i = 0; i < revealed; i++) {
      multiplier *= (safeSpots / (safeSpots - i));
    }
    return multiplier * 0.97; // House edge
  };

  const startGame = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }

    onUpdateBalance(-betAmount);

    // Generate mine positions
    const minePositions: number[] = [];
    while (minePositions.length < mineCount) {
      const pos = Math.floor(Math.random() * BOARD_SIZE);
      if (!minePositions.includes(pos)) {
        minePositions.push(pos);
      }
    }

    setMines(minePositions);
    setBoard(new Array(BOARD_SIZE).fill('hidden'));
    setGameState('playing');
    setRevealedCount(0);
    setCurrentMultiplier(1);
  };

  const revealTile = (index: number) => {
    if (board[index] !== 'hidden') return;

    const newBoard = [...board];
    
    if (mines.includes(index)) {
      // Hit a mine
      newBoard[index] = 'mine';
      // Reveal all mines
      mines.forEach(mineIndex => {
        newBoard[mineIndex] = 'mine';
      });
      setBoard(newBoard);
      setGameState('finished');
      recordGameResult('mines', betAmount, false, 0, currentMultiplier);
      toast.error('💥 You hit a mine!');
    } else {
      // Found a gem
      newBoard[index] = 'gem';
      const newRevealedCount = revealedCount + 1;
      const newMultiplier = calculateMultiplier(newRevealedCount, mineCount);
      
      setBoard(newBoard);
      setRevealedCount(newRevealedCount);
      setCurrentMultiplier(newMultiplier);
      
      toast.success(`💎 Gem found! Multiplier: ${newMultiplier.toFixed(2)}x`);
    }
  };

  const cashOut = async () => {
    const payout = betAmount * currentMultiplier;
    onUpdateBalance(payout);
    setGameState('finished');
    
    // Reveal all mines
    const newBoard = [...board];
    mines.forEach(mineIndex => {
      if (newBoard[mineIndex] === 'hidden') {
        newBoard[mineIndex] = 'revealed';
      }
    });
    setBoard(newBoard);

    await recordGameResult('mines', betAmount, true, payout, currentMultiplier);
    toast.success(`💰 Cashed out ${payout.toFixed(2)} coins!`);
  };

  const resetGame = () => {
    setGameState('betting');
    setBoard([]);
    setMines([]);
    setRevealedCount(0);
    setCurrentMultiplier(1);
  };

  const getTileContent = (index: number) => {
    switch (board[index]) {
      case 'gem':
        return '💎';
      case 'mine':
        return '💣';
      case 'revealed':
        return '💣';
      default:
        return '';
    }
  };

  const getTileClass = (index: number) => {
    const baseClass = "w-12 h-12 border-2 rounded flex items-center justify-center text-lg font-bold cursor-pointer transition-colors ";
    
    switch (board[index]) {
      case 'gem':
        return baseClass + "bg-green-600 border-green-500 text-white";
      case 'mine':
        return baseClass + "bg-red-600 border-red-500 text-white";
      case 'revealed':
        return baseClass + "bg-gray-600 border-gray-500 text-white";
      default:
        return baseClass + "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-yellow-400 font-mono">
            💣 Mines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {gameState === 'betting' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
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
                    Mines
                  </label>
                  <Input
                    type="number"
                    value={mineCount}
                    onChange={(e) => setMineCount(Number(e.target.value))}
                    min="1"
                    max="20"
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                  />
                </div>
              </div>
              <Button
                onClick={startGame}
                disabled={betAmount > balance || betAmount <= 0}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
              >
                Start Game
              </Button>
            </div>
          )}

          {gameState !== 'betting' && (
            <div className="space-y-6">
              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">Gems Found</div>
                  <div className="text-xl font-bold text-green-400 font-mono">
                    {revealedCount}
                  </div>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">Multiplier</div>
                  <div className="text-xl font-bold text-yellow-400 font-mono">
                    {currentMultiplier.toFixed(2)}x
                  </div>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">Potential Win</div>
                  <div className="text-xl font-bold text-blue-400 font-mono">
                    {(betAmount * currentMultiplier).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Game Board */}
              <div className="grid grid-cols-5 gap-2 justify-center max-w-md mx-auto">
                {Array.from({ length: BOARD_SIZE }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => revealTile(index)}
                    disabled={gameState === 'finished' || board[index] !== 'hidden'}
                    className={getTileClass(index)}
                  >
                    {getTileContent(index)}
                  </button>
                ))}
              </div>

              {/* Game Controls */}
              {gameState === 'playing' && revealedCount > 0 && (
                <div className="text-center">
                  <Button
                    onClick={cashOut}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 text-lg"
                  >
                    Cash Out ({(betAmount * currentMultiplier).toFixed(2)} coins)
                  </Button>
                </div>
              )}

              {gameState === 'finished' && (
                <div className="text-center">
                  <Button
                    onClick={resetGame}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-2"
                  >
                    New Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
