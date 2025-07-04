
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const BlackjackGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [gameResult, setGameResult] = useState<string>('');
  const [lastWin, setLastWin] = useState<number | null>(null);

  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        deck.push({ suit, value, numValue });
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const calculateHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;
    
    hand.forEach(card => {
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.numValue;
      }
    });
    
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  const dealInitialCards = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    setLastWin(null);
    
    const deck = createDeck();
    const newPlayerHand = [deck[0], deck[2]];
    const newDealerHand = [deck[1], deck[3]];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameStatus('playing');
    setGameResult('');
    
    // Check for immediate blackjack
    if (calculateHandValue(newPlayerHand) === 21) {
      finishGame(newPlayerHand, newDealerHand);
    }
  };

  const hit = () => {
    const deck = createDeck();
    const newCard = deck[Math.floor(Math.random() * deck.length)];
    const newPlayerHand = [...playerHand, newCard];
    setPlayerHand(newPlayerHand);
    
    if (calculateHandValue(newPlayerHand) > 21) {
      setGameStatus('finished');
      setGameResult('💔 BUST! You lose');
    }
  };

  const stand = () => {
    finishGame(playerHand, dealerHand);
  };

  const finishGame = async (finalPlayerHand: Card[], initialDealerHand: Card[]) => {
    setGameStatus('finished');
    
    let finalDealerHand = [...initialDealerHand];
    const deck = createDeck();
    let deckIndex = 0;
    
    // Dealer draws until 17 or higher
    while (calculateHandValue(finalDealerHand) < 17) {
      finalDealerHand.push(deck[deckIndex++]);
      setDealerHand([...finalDealerHand]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const playerValue = calculateHandValue(finalPlayerHand);
    const dealerValue = calculateHandValue(finalDealerHand);
    
    let result = '';
    let winAmount = 0;
    
    if (playerValue > 21) {
      result = '💔 BUST! You lose';
    } else if (dealerValue > 21) {
      result = '🎉 Dealer busts! You win!';
      winAmount = betAmount * 2;
    } else if (playerValue === 21 && finalPlayerHand.length === 2) {
      result = '🎉 BLACKJACK!';
      winAmount = betAmount * 2.5;
    } else if (playerValue > dealerValue) {
      result = '🎉 You win!';
      winAmount = betAmount * 2;
    } else if (playerValue === dealerValue) {
      result = '🤝 Push (tie)';
      winAmount = betAmount; // Return bet
    } else {
      result = '💔 You lose';
    }
    
    setGameResult(result);
    if (winAmount > 0) {
      setLastWin(winAmount);
      onUpdateBalance(winAmount);
    }
  };

  const newGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameStatus('betting');
    setGameResult('');
    setLastWin(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">♠️ Blackjack</h2>
        
        {gameStatus === 'betting' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white mb-4"
            />
            <Button
              onClick={dealInitialCards}
              disabled={betAmount > balance}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
            >
              Deal Cards ({betAmount} coins)
            </Button>
          </div>
        )}

        {gameStatus !== 'betting' && (
          <div className="space-y-6">
            {/* Dealer Hand */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Dealer: {calculateHandValue(dealerHand)}</h3>
              <div className="flex justify-center space-x-2 mb-4">
                {dealerHand.map((card, index) => (
                  <div key={index} className="bg-white text-black p-4 rounded-lg text-2xl font-bold min-w-[60px]">
                    {card.value}{card.suit}
                  </div>
                ))}
              </div>
            </div>

            {/* Player Hand */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Your Hand: {calculateHandValue(playerHand)}</h3>
              <div className="flex justify-center space-x-2 mb-4">
                {playerHand.map((card, index) => (
                  <div key={index} className="bg-white text-black p-4 rounded-lg text-2xl font-bold min-w-[60px]">
                    {card.value}{card.suit}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            {gameStatus === 'playing' && calculateHandValue(playerHand) <= 21 && (
              <div className="flex gap-2 justify-center">
                <Button onClick={hit} className="bg-green-600 hover:bg-green-700">
                  Hit
                </Button>
                <Button onClick={stand} className="bg-red-600 hover:bg-red-700">
                  Stand
                </Button>
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
        )}
      </div>
    </div>
  );
};
