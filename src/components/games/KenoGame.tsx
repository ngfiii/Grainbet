
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const KenoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
  const [gameStatus, setGameStatus] = useState<'betting' | 'drawing' | 'finished'>('betting');
  const [matches, setMatches] = useState(0);
  const [gameResult, setGameResult] = useState('');
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGame } = useGameHistory();

  const MAX_NUMBERS = 40;
  const MAX_PICKS = 10;
  const NUMBERS_DRAWN = 20;

  // Keno payout table (simplified)
  const getMultiplier = (picked: number, matched: number): number => {
    const payoutTable: { [key: number]: { [key: number]: number } } = {
      1: { 1: 3.6 },
      2: { 1: 1, 2: 12 },
      3: { 2: 3, 3: 46 },
      4: { 2: 1, 3: 5, 4: 120 },
      5: { 3: 2, 4: 12, 5: 800 },
      6: { 3: 1, 4: 3, 5: 35, 6: 1600 },
      7: { 4: 2, 5: 6, 6: 100, 7: 7000 },
      8: { 5: 2, 6: 12, 7: 300, 8: 10000 },
      9: { 5: 1, 6: 4, 7: 40, 8: 1000, 9: 10000 },
      10: { 5: 1, 6: 2, 7: 15, 8: 180, 9: 1000, 10: 10000 }
    };
    
    return payoutTable[picked]?.[matched] || 0;
  };

  const toggleNumber = (num: number) => {
    if (gameStatus !== 'betting') return;
    
    const newSelected = new Set(selectedNumbers);
    if (newSelected.has(num)) {
      newSelected.delete(num);
    } else if (newSelected.size < MAX_PICKS) {
      newSelected.add(num);
    }
    setSelectedNumbers(newSelected);
  };

  const startGame = async () => {
    if (betAmount > balance || selectedNumbers.size === 0) return;
    
    onUpdateBalance(-betAmount);
    setGameStatus('drawing');
    setDrawnNumbers(new Set());
    setMatches(0);
    setLastWin(null);
    setGameResult('');
    
    // Simulate drawing animation
    const drawn = new Set<number>();
    for (let i = 0; i < NUMBERS_DRAWN; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let num;
      do {
        num = Math.floor(Math.random() * MAX_NUMBERS) + 1;
      } while (drawn.has(num));
      
      drawn.add(num);
      setDrawnNumbers(new Set(drawn));
    }
    
    // Calculate results
    const matchedNumbers = Array.from(selectedNumbers).filter(num => drawn.has(num));
    const matchCount = matchedNumbers.length;
    setMatches(matchCount);
    
    const multiplier = getMultiplier(selectedNumbers.size, matchCount);
    
    if (multiplier > 0) {
      const winAmount = betAmount * multiplier;
      setLastWin(winAmount);
      onUpdateBalance(winAmount);
      setGameResult(`🎉 ${matchCount} matches! You win!`);
      await recordGame('keno', betAmount, winAmount, true, multiplier);
    } else {
      setGameResult(`💔 ${matchCount} matches. Better luck next time!`);
      await recordGame('keno', betAmount, 0, false, 0);
    }
    
    setGameStatus('finished');
  };

  const newGame = () => {
    setSelectedNumbers(new Set());
    setDrawnNumbers(new Set());
    setGameStatus('betting');
    setMatches(0);
    setGameResult('');
    setLastWin(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🎯 Keno</h2>
        
        {/* Bet Amount */}
        {gameStatus === 'betting' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        )}

        {/* Game Info */}
        <div className="mb-4 text-center">
          <div className="text-sm text-gray-400">
            Selected: {selectedNumbers.size}/{MAX_PICKS} | 
            {gameStatus === 'finished' && ` Matches: ${matches} | `}
            {selectedNumbers.size > 0 && gameStatus === 'betting' && 
              ` Potential Max Win: ${(betAmount * getMultiplier(selectedNumbers.size, selectedNumbers.size)).toFixed(0)} coins`
            }
          </div>
        </div>

        {/* Number Grid */}
        <div className="grid grid-cols-8 gap-2 mb-6">
          {Array.from({ length: MAX_NUMBERS }, (_, i) => i + 1).map(num => {
            const isSelected = selectedNumbers.has(num);
            const isDrawn = drawnNumbers.has(num);
            const isMatch = isSelected && isDrawn;
            
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={gameStatus !== 'betting'}
                className={cn(
                  "aspect-square text-lg font-bold border-2 rounded-lg transition-all",
                  isMatch
                    ? "bg-green-600 border-green-500 text-white"
                    : isSelected
                    ? "bg-yellow-600 border-yellow-500 text-black"
                    : isDrawn
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                )}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        {gameStatus === 'betting' && (
          <div className="flex gap-2">
            <Button
              onClick={startGame}
              disabled={betAmount > balance || selectedNumbers.size === 0}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
            >
              Draw Numbers ({betAmount} coins)
            </Button>
            <Button
              onClick={() => setSelectedNumbers(new Set())}
              variant="outline"
              className="px-6"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Drawing Status */}
        {gameStatus === 'drawing' && (
          <div className="text-center">
            <div className="text-xl font-bold animate-pulse">Drawing numbers...</div>
            <div className="text-lg">Drawn: {drawnNumbers.size}/{NUMBERS_DRAWN}</div>
          </div>
        )}

        {/* Game Result */}
        {gameStatus === 'finished' && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">{gameResult}</div>
            {lastWin && (
              <div className="text-lg text-green-400 mb-4">
                +{lastWin.toFixed(0)} coins
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
