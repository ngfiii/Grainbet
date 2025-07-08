import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameSave } from '@/hooks/useGameSave';

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

  const { saveGameState, loadGameState, clearGameState } = useGameSave('blackjack');

  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  useEffect(() => {
    loadSavedGame();
  }, []);

  const loadSavedGame = async () => {
    const savedState = await loadGameState();
    if (savedState) {
      setBetAmount(savedState.betAmount || 10);
      setPlayerHand(savedState.playerHand || []);
      setDealerHand(savedState.dealerHand || []);
      setGameStatus(savedState.gameStatus || 'betting');
      setGameResult(savedState.gameResult || '');
      setLastWin(savedState.lastWin || null);
      setShowDealerSecondCard(savedState.showDealerSecondCard || false);
      console.log('Loaded saved Blackjack game');
    }
  };

  const saveCurrentGameState = async () => {
    if (gameStatus === 'playing') {
      await saveGameState({
        betAmount,
        playerHand,
        dealerHand,
        gameStatus,
        gameResult,
        lastWin,
        showDealerSecondCard
      });
    }
  };

  useEffect(() => {
    saveCurrentGameState();
  }, [gameStatus, playerHand, dealerHand, showDealerSecondCard]);

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
      clearGameState();
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
      winAmount = betAmount;
    } else {
      result = '💔 You lose';
    }
    setGameResult(result);
    if (winAmount > 0) {
      setLastWin(winAmount);
      onUpdateBalance(winAmount);
    }
    clearGameState();
  };

  const newGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameStatus('betting');
    setGameResult('');
    setLastWin(null);
    setShowDealerSecondCard(false);
    clearGameState();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-b from-green-800 to-green-900 p-8 rounded-2xl border-4 border-yellow-600 shadow-2xl relative overflow-hidden">
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
          {/* Game UI continues as in your original code... */}
        </div>
      </div>
    </div>
  );
};
