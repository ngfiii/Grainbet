
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import type { Game } from '@/pages/Index';

interface SidebarProps {
  currentGame: Game;
  onGameSelect: (game: Game) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentGame, 
  onGameSelect, 
  collapsed,
  onToggle 
}) => {
  const { user } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === 'ngfi' || user?.id === 'ngfi';

  const games = [
    { id: 'dashboard' as Game, name: 'Dashboard', emoji: '🏠' },
    { id: 'dice' as Game, name: 'Dice', emoji: '🎲' },
    { id: 'limbo' as Game, name: 'Limbo', emoji: '🚀' },
    { id: 'blackjack' as Game, name: 'Blackjack', emoji: '♠️' },
    { id: 'mines' as Game, name: 'Mines', emoji: '💣' },
    { id: 'keno' as Game, name: 'Keno', emoji: '🔮' },
    { id: 'plinko' as Game, name: 'Plinko', emoji: '🏀' },
  ];

  return (
    <div className={cn(
      "bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col relative z-50",
      collapsed ? "w-20" : "w-64",
      "md:relative absolute inset-y-0 left-0"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-yellow-400 font-mono">GrainBet</h1>
        )}
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-700 flex-shrink-0"
        >
          {collapsed ? '→' : '←'}
        </Button>
      </div>

      {/* Games List */}
      <div className="flex-1 p-2 space-y-1">
        {games.map((game) => (
          <Button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            variant={currentGame === game.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start font-mono transition-all duration-200",
              currentGame === game.id 
                ? "bg-yellow-600 text-black hover:bg-yellow-700" 
                : "text-gray-300 hover:text-white hover:bg-gray-700",
              collapsed ? "px-2" : "px-4"
            )}
          >
            <span className="text-lg mr-3 flex-shrink-0">{game.emoji}</span>
            {!collapsed && <span className="truncate">{game.name}</span>}
          </Button>
        ))}

        {/* Admin Panel Link */}
        {isAdmin && (
          <Link to="/admin" className="block">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-mono transition-all duration-200 text-red-400 hover:text-white hover:bg-red-700/20",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <span className="text-lg mr-3 flex-shrink-0">⚙️</span>
              {!collapsed && <span className="truncate">Admin Panel</span>}
            </Button>
          </Link>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!collapsed && (
          <div className="text-xs text-gray-500 font-mono text-center">
            © 2024 GrainBet
          </div>
        )}
      </div>
    </div>
  );
};
