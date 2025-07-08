
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameHistory } from '@/hooks/useGameHistory';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

export const BlackjackGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [result, setResult] = useState<string>('');
  const [winAmount, setWinAmount] = useState(0);
  const { recordGame } = useGameHistory();

  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = (): Card[] => {
    const newDeck: Card[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        newDeck.push({ suit, value, numValue });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
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

  const drawCard = (currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    const card = currentDeck[0];
    const newDeck = currentDeck.slice(1);
    return { card, newDeck };
  };

  const startGame = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    const newDeck = createDeck();
    
    const { card: playerCard1, newDeck: deck1 } = drawCard(newDeck);
    const { card: dealerCard1, newDeck: deck2 } = drawCard(deck1);
    const { card: playerCard2, newDeck: deck3 } = drawCard(deck2);
    const { card: dealerCard2, newDeck: finalDeck } = drawCard(deck3);
    
    setPlayerHand([playerCard1, playerCard2]);
    setDealerHand([dealerCard1, dealerCard2]);
    setDeck(finalDeck);
    setGameState('playing');
    setResult('');
    setWinAmount(0);
  };

  const hit = () => {
    const { card, newDeck } = drawCard(deck);
    const newPlayerHand = [...playerHand, card];
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);
    
    if (calculateHandValue(newPlayerHand) > 21) {
      endGame(newPlayerHand, dealerHand);
    }
  };

  const stand = () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    
    while (calculateHandValue(currentDealerHand) < 17) {
      const { card, newDeck } = drawCard(currentDeck);
      currentDealerHand.push(card);
      currentDeck = newDeck;
    }
    
    setDealerHand(currentDealerHand);
    setDeck(currentDeck);
    endGame(playerHand, currentDealerHand);
  };

  const endGame = async (finalPlayerHand: Card[], finalDealerHand: Card[]) => {
    const playerValue = calculateHandValue(finalPlayerHand);
    const dealerValue = calculateHandValue(finalDealerHand);
    
    let gameResult = '';
    let payout = 0;
    let isWin = false;
    
    if (playerValue > 21) {
      gameResult = 'Bust! You lose.';
    } else if (dealerValue > 21) {
      gameResult = 'Dealer busts! You win!';
      payout = betAmount * 2;
      isWin = true;
    } else if (playerValue > dealerValue) {
      gameResult = 'You win!';
      payout = betAmount * 2;
      isWin = true;
    } else if (playerValue < dealerValue) {
      gameResult = 'Dealer wins.';
    } else {
      gameResult = 'Push! It\'s a tie.';
      payout = betAmount;
      isWin = true;
    }
    
    setResult(gameResult);
    setWinAmount(payout);
    setGameState('finished');
    
    if (payout > 0) {
      onUpdateBalance(payout);
    }
    
    // Record game history
    await recordGame('blackjack', betAmount, payout, isWin, payout / betAmount);
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setDeck([]);
    setResult('');
    setWinAmount(0);
  };

  const renderCard = (card: Card, hidden = false) => (
    <div className="bg-white text-black rounded-lg p-3 m-1 min-w-[60px] text-center shadow-lg">
      {hidden ? (
        <div className="text-2xl">🂠</div>
      ) : (
        <>
          <div className={cn("text-lg font-bold", 
            ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'
          )}>
            {card.value}
          </div>
          <div className={cn("text-xl", 
            ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'
          )}>
            {card.suit}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">🃏 Blackjack</h2>
        
        {gameState === 'betting' && (
          <div className="text-center space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-gray-700 border-gray-600 text-white max-w-xs mx-auto"
              />
            </div>
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3"
            >
              Deal Cards ({betAmount} coins)
            </Button>
          </div>
        )}

        {gameState !== 'betting' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Dealer's Hand ({calculateHandValue(dealerHand)})</h3>
              <div className="flex flex-wrap">
                {dealerHand.map((card, index) => (
                  <div key={index}>
                    {renderCard(card, gameState === 'playing' && index === 1)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Your Hand ({calculateHandValue(playerHand)})</h3>
              <div className="flex flex-wrap">
                {playerHand.map((card, index) => (
                  <div key={index}>{renderCard(card)}</div>
                ))}
              </div>
            </div>

            {gameState === 'playing' && (
              <div className="text-center space-x-4">
                <Button
                  onClick={hit}
                  disabled={calculateHandValue(playerHand) >= 21}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2"
                >
                  Hit
                </Button>
                <Button
                  onClick={stand}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-2"
                >
                  Stand
                </Button>
              </div>
            )}

            {gameState === 'finished' && (
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold">
                  {result}
                </div>
                {winAmount > 0 && (
                  <div className="text-lg text-green-400">
                    You won {winAmount} coins!
                  </div>
                )}
                <Button
                  onClick={newGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2"
                >
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
