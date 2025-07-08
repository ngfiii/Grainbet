import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameHistory } from '@/hooks/useGameHistory';

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
  const [deck, setDeck] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [gameResult, setGameResult] = useState('');
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { recordGameHistory } = useGameHistory();

  const createDeck = (): Card[] => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
      for (const value of values) {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        deck.push({ suit, value, numValue });
      }
    }
    
    return shuffleDeck(deck);
  };

  const shuffleDeck = (deck: Card[]): Card[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const dealCard = (currentDeck: Card[]): { card: Card; remainingDeck: Card[] } => {
    const card = currentDeck[0];
    const remainingDeck = currentDeck.slice(1);
    return { card, remainingDeck };
  };

  const calculateHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.numValue;
      }
    }
    
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  const startGame = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    const newDeck = createDeck();
    
    const { card: playerCard1, remainingDeck: deck1 } = dealCard(newDeck);
    const { card: dealerCard1, remainingDeck: deck2 } = dealCard(deck1);
    const { card: playerCard2, remainingDeck: deck3 } = dealCard(deck2);
    const { card: dealerCard2, remainingDeck: finalDeck } = dealCard(deck3);
    
    setPlayerHand([playerCard1, playerCard2]);
    setDealerHand([dealerCard1, dealerCard2]);
    setDeck(finalDeck);
    setGameStatus('playing');
    setGameResult('');
    setLastWin(null);
  };

  const hit = () => {
    if (gameStatus !== 'playing') return;
    
    const { card, remainingDeck } = dealCard(deck);
    const newPlayerHand = [...playerHand, card];
    setPlayerHand(newPlayerHand);
    setDeck(remainingDeck);
    
    if (calculateHandValue(newPlayerHand) > 21) {
      endGame(newPlayerHand, dealerHand);
    }
  };

  const stand = () => {
    setGameStatus('dealer');
    playDealerHand();
  };

  const playDealerHand = async () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    
    while (calculateHandValue(currentDealerHand) < 17) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { card, remainingDeck } = dealCard(currentDeck);
      currentDealerHand = [...currentDealerHand, card];
      currentDeck = remainingDeck;
      setDealerHand([...currentDealerHand]);
      setDeck([...currentDeck]);
    }
    
    endGame(playerHand, currentDealerHand);
  };

  const endGame = async (finalPlayerHand: Card[], finalDealerHand: Card[]) => {
    const playerValue = calculateHandValue(finalPlayerHand);
    const dealerValue = calculateHandValue(finalDealerHand);
    
    let result = '';
    let isWin = false;
    let payout = 0;
    
    if (playerValue > 21) {
      result = 'Bust! You lose.';
      isWin = false;
    } else if (dealerValue > 21) {
      result = 'Dealer busts! You win!';
      isWin = true;
      payout = betAmount * 2;
    } else if (playerValue > dealerValue) {
      result = 'You win!';
      isWin = true;
      payout = betAmount * 2;
    } else if (playerValue < dealerValue) {
      result = 'Dealer wins.';
      isWin = false;
    } else {
      result = 'Push! It\'s a tie.';
      isWin = false;
      payout = betAmount; // Return bet on tie
    }
    
    if (payout > 0) {
      onUpdateBalance(payout);
      if (isWin) {
        setLastWin(payout - betAmount);
      }
    }

    // Record game history
    await recordGameHistory('blackjack', betAmount, payout, isWin);
    
    setGameResult(result);
    setGameStatus('finished');
  };

  const newGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameStatus('betting');
    setGameResult('');
    setLastWin(null);
  };

  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🃏 Blackjack</h2>
        
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

        {gameStatus !== 'betting' && (
          <div className="space-y-6">
            {/* Dealer Hand */}
            <div>
              <h3 className="text-xl font-bold mb-2">
                Dealer ({gameStatus === 'playing' ? '?' : dealerValue})
              </h3>
              <div className="flex gap-2 flex-wrap">
                {dealerHand.map((card, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-16 h-24 bg-white rounded-lg flex flex-col items-center justify-center text-black font-bold border-2",
                      index === 1 && gameStatus === 'playing' ? 'bg-gray-600 text-gray-400' : ''
                    )}
                  >
                    {index === 1 && gameStatus === 'playing' ? (
                      <div>?</div>
                    ) : (
                      <>
                        <div className={cn(
                          card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'
                        )}>
                          {card.value}
                        </div>
                        <div className={cn(
                          card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'
                        )}>
                          {card.suit}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Player Hand */}
            <div>
              <h3 className="text-xl font-bold mb-2">You ({playerValue})</h3>
              <div className="flex gap-2 flex-wrap">
                {playerHand.map((card, index) => (
                  <div
                    key={index}
                    className="w-16 h-24 bg-white rounded-lg flex flex-col items-center justify-center text-black font-bold border-2"
                  >
                    <div className={cn(
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'
                    )}>
                      {card.value}
                    </div>
                    <div className={cn(
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'
                    )}>
                      {card.suit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {gameStatus === 'betting' && (
          <Button
            onClick={startGame}
            disabled={betAmount > balance}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
          >
            Deal Cards ({betAmount} coins)
          </Button>
        )}

        {gameStatus === 'playing' && (
          <div className="flex gap-2">
            <Button onClick={hit} className="flex-1 bg-green-600 hover:bg-green-700">
              Hit
            </Button>
            <Button onClick={stand} className="flex-1 bg-red-600 hover:bg-red-700">
              Stand
            </Button>
          </div>
        )}

        {gameStatus === 'dealer' && (
          <div className="text-center">
            <div className="text-xl font-bold animate-pulse">Dealer playing...</div>
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">{gameResult}</div>
            {lastWin && lastWin > 0 && (
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
