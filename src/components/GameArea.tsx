
import type { Game } from '@/pages/Index';
import DashboardGame from '@/components/games/DashboardGame';
import { DiceGame } from '@/components/games/DiceGame';
import { LimboGame } from '@/components/games/LimboGame';
import { BlackjackGame } from '@/components/games/BlackjackGame';
import { MinesGame } from '@/components/games/MinesGame';
import { KenoGame } from '@/components/games/KenoGame';
import { PlinkoGame } from '@/components/games/PlinkoGame';

interface GameAreaProps {
  currentGame: Game;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  onGameSelect: (game: Game) => void;
}

export const GameArea: React.FC<GameAreaProps> = ({ 
  currentGame, 
  balance, 
  onUpdateBalance,
  onGameSelect 
}) => {
  const renderGame = () => {
    const gameProps = { balance, onUpdateBalance };
    
    switch (currentGame) {
      case 'dashboard': return <DashboardGame {...gameProps} onGameSelect={onGameSelect} />;
      case 'dice': return <DiceGame {...gameProps} />;
      case 'limbo': return <LimboGame {...gameProps} />;
      case 'blackjack': return <BlackjackGame {...gameProps} />;
      case 'mines': return <MinesGame {...gameProps} />;
      case 'keno': return <KenoGame {...gameProps} />;
      case 'plinko': return <PlinkoGame {...gameProps} />;
      default: return <DashboardGame {...gameProps} onGameSelect={onGameSelect} />;
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      {renderGame()}
    </div>
  );
};
