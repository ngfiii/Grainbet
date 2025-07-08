
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DiceGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const DiceGame: React.FC<DiceGameProps> = ({ balance, onUpdateBalance }) => {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [prediction, setPrediction] = useState<number>(4);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{ win: boolean; payout: number } | null>(null);

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  const rollDice = async () => {
    if (!user) {
      toast.error('Please log in to play');
      return;
    }

    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    setIsRolling(true);
    setGameResult(null);

    // Simulate dice roll
    const roll = Math.floor(Math.random() * 6) + 1;
    setLastRoll(roll);

    const isWin = roll >= prediction;
    const multiplier = isWin ? (6 / (6 - prediction + 1)) : 0;
    const payout = isWin ? betAmount * multiplier : 0;
    const newBalance = balance - betAmount + payout;

    // Update balance
    const { error: balanceError } = await supabase
      .from('user_balances')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      toast.error('Failed to update balance');
      setIsRolling(false);
      return;
    }

    // Record game history
    const { error: historyError } = await supabase
      .from('game_history')
      .insert({
        user_id: user.id,
        game_type: 'dice',
        bet_amount: betAmount,
        payout: payout,
        is_win: isWin,
        multiplier: multiplier
      });

    if (historyError) {
      console.error('Failed to record game history:', historyError);
    }

    // Update user stats
    await supabase.rpc('update_user_stats', {
      p_user_id: user.id,
      p_bet_amount: betAmount,
      p_payout: payout,
      p_is_win: isWin,
      p_multiplier: multiplier
    });

    onUpdateBalance(newBalance);
    setGameResult({ win: isWin, payout });

    setTimeout(() => {
      setIsRolling(false);
      if (isWin) {
        toast.success(`You won ${payout.toFixed(0)} coins!`);
      } else {
        toast.error(`You lost ${betAmount} coins`);
      }
    }, 2000);
  };

  const DiceIcon = lastRoll ? diceIcons[lastRoll - 1] : Dice1;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-yellow-400 font-mono text-2xl text-center">
            🎲 Dice Game
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Predict if the dice will land on your number or higher
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className={`p-8 rounded-lg ${isRolling ? 'animate-bounce' : ''}`}>
              <DiceIcon className="w-24 h-24 text-yellow-400" />
            </div>
          </div>

          {gameResult && (
            <div className={`text-center p-4 rounded-lg ${gameResult.win ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
              <div className="text-xl font-bold">
                {gameResult.win ? `You Won ${gameResult.payout.toFixed(0)} Coins! 🎉` : 'You Lost! 😞'}
              </div>
              <div className="text-sm mt-1">
                Rolled: {lastRoll} | Predicted: {prediction}+
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Amount
                </label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  max={balance}
                  min={1}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={isRolling}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prediction (Roll {prediction} or higher)
                </label>
                <Input
                  type="number"
                  value={prediction}
                  onChange={(e) => setPrediction(Number(e.target.value))}
                  min={1}
                  max={6}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={isRolling}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-750 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Multiplier</div>
                <div className="text-xl font-bold text-yellow-400">
                  {(6 / (6 - prediction + 1)).toFixed(2)}x
                </div>
              </div>

              <div className="bg-gray-750 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Potential Win</div>
                <div className="text-xl font-bold text-green-400">
                  {(betAmount * (6 / (6 - prediction + 1))).toFixed(0)} coins
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={rollDice}
            disabled={isRolling || betAmount > balance || betAmount <= 0}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiceGame;
