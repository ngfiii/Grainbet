
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameHistory } from '@/hooks/useGameHistory';

interface BlackjackGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({ balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [gameResult, setGameResult] = useState<string | null>(null);
  const { recordGameResult } = useGameHistory();

  const suits = ['♠', '♥', '♦', '♣'];
  const values = [
    { value: 'A', numValue: 11 },
    { value: '2', numValue: 2 },
    { value: '3', numValue: 3 },
    { value: '4', numValue: 4 },
    { value: '5', numValue: 5 },
    { value: '6', numValue: 6 },
    { value: '7', numValue: 7 },
    { value: '8', numValue: 8 },
    { value: '9', numValue: 9 },
    { value: '10', numValue: 10 },
    { value: 'J', numValue: 10 },
    { value: 'Q', numValue: 10 },
    { value: 'K', numValue: 10 }
  ];

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    suits.forEach(suit => {
      values.forEach(val => {
        deck.push({ suit, value: val.value, numValue: val.numValue });
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (cards: Card[]): number => {
    let score = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.numValue;
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  };

  const dealCard = (deck: Card[]): Card => {
    return deck.pop()!;
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

    const deck = createDeck();
    const playerHand = [dealCard(deck), dealCard(deck)];
    const dealerHand = [dealCard(deck), dealCard(deck)];

    setPlayerCards(playerHand);
    setDealerCards(dealerHand);
    setGameState('playing');
    setGameResult(null);

    const playerScore = calculateScore(playerHand);
    if (playerScore === 21) {
      finishGame(playerHand, dealerHand, 'blackjack');
    }
  };

  const hit = () => {
    const deck = createDeck();
    const newCard = dealCard(deck);
    const newPlayerCards = [...playerCards, newCard];
    setPlayerCards(newPlayerCards);

    const playerScore = calculateScore(newPlayerCards);
    if (playerScore > 21) {
      finishGame(newPlayerCards, dealerCards, 'bust');
    }
  };

  const stand = () => {
    setGameState('dealer');
    let newDealerCards = [...dealerCards];
    const deck = createDeck();

    while (calculateScore(newDealerCards) < 17) {
      newDealerCards.push(dealCard(deck));
    }

    setDealerCards(newDealerCards);
    finishGame(playerCards, newDealerCards, 'compare');
  };

  const finishGame = async (playerHand: Card[], dealerHand: Card[], reason: string) => {
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    let result = '';
    let payout = 0;
    let isWin = false;

    if (reason === 'blackjack') {
      result = 'Blackjack! You win!';
      payout = betAmount * 2.5;
      isWin = true;
    } else if (reason === 'bust') {
      result = 'Bust! You lose!';
      payout = 0;
      isWin = false;
    } else if (dealerScore > 21) {
      result = 'Dealer busts! You win!';
      payout = betAmount * 2;
      isWin = true;
    } else if (playerScore > dealerScore) {
      result = 'You win!';
      payout = betAmount * 2;
      isWin = true;
    } else if (playerScore < dealerScore) {
      result = 'Dealer wins!';
      payout = 0;
      isWin = false;
    } else {
      result = 'Push! It\'s a tie!';
      payout = betAmount;
      isWin = false;
    }

    if (payout > 0) {
      onUpdateBalance(payout);
    }

    setGameResult(result);
    setGameState('finished');

    // Record the game result
    const multiplier = payout > 0 ? payout / betAmount : 0;
    await recordGameResult('blackjack', betAmount, isWin, payout, multiplier);

    if (isWin) {
      toast.success(result);
    } else {
      toast.error(result);
    }
  };

  const resetGame = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setGameState('betting');
    setGameResult(null);
  };

  const renderCard = (card: Card) => (
    <div className="inline-block w-16 h-24 bg-white rounded border-2 border-gray-300 mr-2 mb-2 p-1 text-center">
      <div className={`text-lg font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>
        {card.value}
      </div>
      <div className={`text-2xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}>
        {card.suit}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-yellow-400 font-mono">
            ♠️ Blackjack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {gameState === 'betting' && (
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
              <Button
                onClick={startGame}
                disabled={betAmount > balance || betAmount <= 0}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 text-lg"
              >
                Deal Cards
              </Button>
            </div>
          )}

          {gameState !== 'betting' && (
            <div className="space-y-6">
              {/* Dealer Hand */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Dealer ({gameState === 'playing' ? '?' : calculateScore(dealerCards)})
                </h3>
                <div>
                  {dealerCards.map((card, index) => (
                    <div key={index} className="inline-block">
                      {gameState === 'playing' && index === 1 ? (
                        <div className="inline-block w-16 h-24 bg-blue-600 rounded border-2 border-gray-300 mr-2 mb-2 flex items-center justify-center">
                          <span className="text-white text-2xl">?</span>
                        </div>
                      ) : (
                        renderCard(card)
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Hand */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  You ({calculateScore(playerCards)})
                </h3>
                <div>
                  {playerCards.map((card, index) => (
                    <div key={index} className="inline-block">
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Controls */}
              {gameState === 'playing' && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={hit}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2"
                  >
                    Hit
                  </Button>
                  <Button
                    onClick={stand}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2"
                  >
                    Stand
                  </Button>
                </div>
              )}

              {gameResult && (
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-400 mb-4">
                    {gameResult}
                  </div>
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
