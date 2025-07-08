
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { useBalance } from '@/hooks/useBalance';
import { useGameHistory } from '@/hooks/useGameHistory';
import { toast } from 'sonner';

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const DiceGame = () => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetNumber, setTargetNumber] = useState(4);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const { balance, updateBalance } = useBalance();
  const { recordGame } = useGameHistory();

  const rollDice = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }

    if (betAmount <= 0) {
      toast.error('Please enter a valid bet amount!');
      return;
    }

    setIsRolling(true);
    setDiceResult(null);
    setIsWin(null);

    // Simulate rolling animation
    const rollAnimation = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(async () => {
      clearInterval(rollAnimation);
      const finalResult = Math.floor(Math.random() * 6) + 1;
      setDiceResult(finalResult);
      
      const win = finalResult >= targetNumber;
      setIsWin(win);
      
      const payout = win ? betAmount * 2 : 0;
      const newBalance = balance - betAmount + payout;
      
      await updateBalance(newBalance);
      await recordGame('dice', betAmount, payout, win);
      
      if (win) {
        toast.success(`You won ${payout} coins!`);
      } else {
        toast.error(`You lost ${betAmount} coins!`);
      }
      
      setIsRolling(false);
    }, 2000);
  };

  const DiceIcon = diceResult ? diceIcons[diceResult - 1] : Dice1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-400">🎲 Dice Game</CardTitle>
          <CardDescription className="text-gray-300">
            Roll the dice and bet on the outcome!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Your Balance</p>
            <p className="text-2xl font-bold text-green-400">{balance} coins</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max={balance}
                disabled={isRolling}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Number (win if dice ≥ this number)
              </label>
              <Input
                type="number"
                value={targetNumber}
                onChange={(e) => setTargetNumber(Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max="6"
                disabled={isRolling}
              />
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <DiceIcon 
                size={80} 
                className={`${isRolling ? 'animate-spin' : ''} ${
                  isWin === true ? 'text-green-400' : 
                  isWin === false ? 'text-red-400' : 'text-white'
                }`}
              />
            </div>
            
            {diceResult && !isRolling && (
              <div className="space-y-2">
                <p className="text-lg">You rolled: <span className="font-bold">{diceResult}</span></p>
                <p className="text-lg">Target: <span className="font-bold">{targetNumber}+</span></p>
                <p className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                  {isWin ? `You Win! +${betAmount * 2} coins` : `You Lose! -${betAmount} coins`}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={rollDice}
            disabled={isRolling || betAmount > balance || betAmount <= 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg"
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </Button>

          <div className="text-center text-sm text-gray-400">
            <p>Win chance depends on target number:</p>
            <p>Target 1: 100% chance (1x payout)</p>
            <p>Target 2-6: Decreasing chance (2x payout)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiceGame;
