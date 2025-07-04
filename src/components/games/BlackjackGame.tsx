
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
  const [showDealerSecondCard, setShowDealerSecondCard] = useState(false);

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

  const getDealerVisibleValue = (): number => {
    if (dealerHand.length === 0) return 0;
    if (!showDealerSecondCard && dealerHand.length > 1) {
      return dealerHand[0].value === 'A' ? 11 : dealerHand[0].numValue;
    }
    return calculateHandValue(dealerHand);
  };

  const dealInitialCards = () => {
    if (betAmount > balance) return;
    
    onUpdateBalance(-betAmount);
    setLastWin(null);
    setShowDealerSecondCard(false);
    
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
      setShowDealerSecondCard(true);
      setGameStatus('finished');
      setGameResult('💔 BUST! You lose');
    }
  };

  const stand = () => {
    setShowDealerSecondCard(true);
    finishGame(playerHand, dealerHand);
  };

  const finishGame = async (finalPlayerHand: Card[], initialDealerHand: Card[]) => {
    setGameStatus('finished');
    setShowDealerSecondCard(true);
    
    let finalDealerHand = [...initialDealerHand];
    const deck = createDeck();
    let deckIndex = 0;
    
    // Dealer draws until 17 or higher (following proper blackjack rules)
    while (calculateHandValue(finalDealerHand) < 17) {
      await new Promise(resolve => setTimeout(resolve, 800));
      finalDealerHand.push(deck[deckIndex++]);
      setDealerHand([...finalDealerHand]);
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
    setShowDealerSecondCard(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Casino Table Background */}
      <div className="bg-gradient-to-b from-green-800 to-green-900 p-8 rounded-2xl border-4 border-yellow-600 shadow-2xl relative overflow-hidden">
        {/* Table Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">♠️ Blackjack</h2>
          
          {gameStatus === 'betting' && (
            <div className="mb-6 bg-gray-800/80 p-6 rounded-lg backdrop-blur-sm">
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-gray-700 border-gray-600 text-white mb-4 transition-all duration-200 focus:ring-2 focus:ring-yellow-400"
              />
              <Button
                onClick={dealInitialCards}
                disabled={betAmount > balance}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105"
              >
                Deal Cards ({betAmount} coins)
              </Button>
            </div>
          )}

          {gameStatus !== 'betting' && (
            <div className="space-y-8">
              {/* Dealer Hand */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-yellow-200">
                  Dealer: {getDealerVisibleValue()}{!showDealerSecondCard && dealerHand.length > 1 ? '+?' : ''}
                </h3>
                <div className="flex justify-center space-x-3 mb-4">
                  {dealerHand.map((card, index) => (
                    <div 
                      key={index} 
                      className={`relative transition-all duration-500 transform ${
                        index > 0 ? 'animate-slide-in-right' : ''
                      }`}
                    >
                      {/* Hidden second card */}
                      {index === 1 && !showDealerSecondCard ? (
                        <div className="bg-blue-900 border-2 border-blue-700 p-4 rounded-lg text-4xl font-bold min-w-[80px] h-[120px] flex items-center justify-center shadow-lg transform perspective-1000 rotateY-180 transition-transform duration-700">
                          🎴
                        </div>
                      ) : (
                        <div className={`bg-white text-black border-2 p-4 rounded-lg text-3xl font-bold min-w-[80px] h-[120px] flex flex-col items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 ${
                          card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-black'
                        }`}>
                          <div>{card.value}</div>
                          <div className="text-2xl">{card.suit}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Divider */}
              <div className="border-t-2 border-yellow-400/30 relative">
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                  VS
                </div>
              </div>

              {/* Player Hand */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-yellow-200">Your Hand: {calculateHandValue(playerHand)}</h3>
                <div className="flex justify-center space-x-3 mb-6">
                  {playerHand.map((card, index) => (
                    <div 
                      key={index} 
                      className={`bg-white text-black border-2 p-4 rounded-lg text-3xl font-bold min-w-[80px] h-[120px] flex flex-col items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 animate-slide-in-right ${
                        card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-black'
                      }`}
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div>{card.value}</div>
                      <div className="text-2xl">{card.suit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Controls */}
              {gameStatus === 'playing' && calculateHandValue(playerHand) <= 21 && (
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={hit} 
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 transition-all duration-200 hover:scale-105"
                  >
                    Hit
                  </Button>
                  <Button 
                    onClick={stand} 
                    className="bg-red-600 hover:bg-red-700 px-8 py-3 transition-all duration-200 hover:scale-105"
                  >
                    Stand
                  </Button>
                </div>
              )}

              {/* Game Result */}
              {gameStatus === 'finished' && (
                <div className="text-center bg-gray-800/80 p-6 rounded-lg backdrop-blur-sm animate-fade-in">
                  <div className="text-2xl font-bold mb-4 animate-pulse">{gameResult}</div>
                  {lastWin && (
                    <div className="text-lg text-green-400 mb-4 animate-bounce">
                      +{lastWin.toFixed(0)} coins
                    </div>
                  )}
                  <Button 
                    onClick={newGame} 
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-3 transition-all duration-200 hover:scale-105"
                  >
                    New Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
