
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameHistory } from '@/hooks/useGameHistory';

interface KenoGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const KenoGame: React.FC<KenoGameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'selecting' | 'playing' | 'finished'>('selecting');
  const [matches, setMatches] = useState(0);
  const { recordGameResult } = useGameHistory();

  const MAX_NUMBERS = 80;
  const MAX_SELECTION = 10;
  const DRAW_COUNT = 20;

  const payoutTable: { [key: number]: { [key: number]: number } } = {
    1: { 1: 3 },
    2: { 1: 1, 2: 9 },
    3: { 1: 1, 2: 2, 3: 16 },
    4: { 1: 0.5, 2: 2, 3: 6, 4: 12 },
    5: { 1: 0.5, 2: 1, 3: 3, 4: 15, 5: 50 },
    6: { 1: 0.5, 2: 1, 3: 2, 4: 3, 5: 30, 6: 75 },
    7: { 1: 0.5, 2: 0.5, 3: 1, 4: 6, 5: 12, 6: 36, 7: 100 },
    8: { 1: 0.5, 2: 0.5, 3: 1, 4: 3, 5: 6, 6: 19, 7: 90, 8: 720 },
    9: { 1: 0.5, 2: 0.5, 3: 1, 4: 2, 5: 4, 6: 8, 7: 20, 8: 80, 9: 1200 },
    10: { 1: 0, 2: 0.5, 3: 1, 4: 2, 5: 3, 6: 5, 7: 10, 8: 30, 9: 600, 10: 1800 }
  };

  const toggleNumber = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < MAX_SELECTION) {
      setSelectedNumbers([...selectedNumbers, number]);
    } else {
      toast.error(`Maximum ${MAX_SELECTION} numbers allowed`);
    }
  };

  const playGame = async () => {
    if (selectedNumbers.length === 0) {
      toast.error('Please select at least one number');
      return;
    }

    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }

    onUpdateBalance(-betAmount);
    setGameState('playing');

    // Draw random numbers
    const drawn: number[] = [];
    while (drawn.length < DRAW_COUNT) {
      const num = Math.floor(Math.random() * MAX_NUMBERS) + 1;
      if (!drawn.includes(num)) {
        drawn.push(num);
      }
    }

    setTimeout(async () => {
      setDrawnNumbers(drawn.sort((a, b) => a - b));
      
      // Calculate matches
      const matchCount = selectedNumbers.filter(num => drawn.includes(num)).length;
      setMatches(matchCount);

      // Calculate payout
      const selectedCount = selectedNumbers.length;
      const multiplier = payoutTable[selectedCount]?.[matchCount] || 0;
      const payout = betAmount * multiplier;

      if (payout > 0) {
        onUpdateBalance(payout);
        toast.success(`${matchCount} matches! Won ${payout.toFixed(2)} coins!`);
      } else {
        toast.error(`${matchCount} matches. Better luck next time!`);
      }

      await recordGameResult('keno', betAmount, payout > 0, payout, multiplier);
      setGameState('finished');
    }, 3000);
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setGameState('selecting');
    setMatches(0);
  };

  const getNumberClass = (number: number) => {
    const baseClass = "w-10 h-10 border-2 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ";
    
    if (gameState === 'finished' && drawnNumbers.includes(number) && selectedNumbers.includes(number)) {
      return baseClass + "bg-green-600 border-green-500 text-white";
    } else if (gameState === 'finished' && drawnNumbers.includes(number)) {
      return baseClass + "bg-blue-600 border-blue-500 text-white";
    } else if (selectedNumbers.includes(number)) {
      return baseClass + "bg-yellow-600 border-yellow-500 text-black";
    } else {
      return baseClass + "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-yellow-400 font-mono">
            🔮 Keno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {gameState === 'selecting' && (
            <div className="space-y-4">
              <div className="max-w-xs mx-auto">
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
              
              <div className="text-center">
                <p className="text-gray-300 mb-2">
                  Select {selectedNumbers.length}/{MAX_SELECTION} numbers
                </p>
              </div>
            </div>
          )}

          {/* Number Grid */}
          <div className="grid grid-cols-10 gap-2 justify-center">
            {Array.from({ length: MAX_NUMBERS }, (_, index) => {
              const number = index + 1;
              return (
                <button
                  key={number}
                  onClick={() => toggleNumber(number)}
                  disabled={gameState !== 'selecting'}
                  className={getNumberClass(number)}
                >
                  {number}
                </button>
              );
            })}
          </div>

          {gameState === 'playing' && (
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 animate-pulse">
                Drawing Numbers...
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white mb-2">
                  Drawn Numbers: {drawnNumbers.join(', ')}
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {matches} Matches!
                </div>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <span className="inline-block w-4 h-4 bg-yellow-600 rounded-full mr-2"></span>
                  <span className="text-gray-300 text-sm">Your picks</span>
                  <span className="inline-block w-4 h-4 bg-blue-600 rounded-full mx-2"></span>
                  <span className="text-gray-300 text-sm">Drawn numbers</span>
                  <span className="inline-block w-4 h-4 bg-green-600 rounded-full mx-2"></span>
                  <span className="text-gray-300 text-sm">Matches</span>
                </div>
              </div>
            </div>
          )}

          {/* Game Controls */}
          {gameState === 'selecting' && (
            <Button
              onClick={playGame}
              disabled={selectedNumbers.length === 0 || betAmount > balance || betAmount <= 0}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
            >
              Play Keno
            </Button>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={resetGame}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
            >
              New Game
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
