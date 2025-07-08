import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const games = [{
    id: 'dashboard' as Game,
    name: 'Dashboard',
    emoji: '🏠'
  }, {
    id: 'dice' as Game,
    name: 'Dice',
    emoji: '🎲'
  }, {
    id: 'limbo' as Game,
    name: 'Limbo',
    emoji: '🚀'
  }, {
    id: 'blackjack' as Game,
    name: 'Blackjack',
    emoji: '♠️'
  }, {
    id: 'mines' as Game,
    name: 'Mines',
    emoji: '💣'
  }, {
    id: 'keno' as Game,
    name: 'Keno',
    emoji: '🔮'
  }, {
    id: 'plinko' as Game,
    name: 'Plinko',
    emoji: '🏀'
  }];
  const handleAdminClick = () => {
    navigate('/admin');
  };
  const handleProfileClick = () => {
    navigate('/profile');
  };
  const handleLeaderboardClick = () => {
    navigate('/leaderboard');
  };
  return <div className={cn("bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col relative z-50", collapsed ? "w-16 md:w-20" : "w-64", "md:relative absolute inset-y-0 left-0")}>
      {/* Header */}
      <div className="p-2 md:p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && <div className="flex items-center space-x-2">
            <img alt="GrainBet Logo" className="w-6 h-6 md:w-8 md:h-8" src="/lovable-uploads/d47faee5-d173-4436-94ba-aea524d03aa6.png" />
            <h1 className="text-lg md:text-xl font-bold text-yellow-400 font-mono">GrainBet</h1>
          </div>}
        {collapsed && <img alt="GrainBet Logo" className="w-6 h-6 mx-auto" src="/lovable-uploads/b02b29fd-4df8-4fd3-83d6-52e449f3c4ab.png" />}
        <Button onClick={onToggle} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700 flex-shrink-0 p-1 md:p-2">
          {collapsed ? '→' : '←'}
        </Button>
      </div>

      {/* Games List */}
      <div className="flex-1 p-1 md:p-2 space-y-1 overflow-y-auto">
        {games.map(game => <Button key={game.id} onClick={() => onGameSelect(game.id)} variant={currentGame === game.id ? "secondary" : "ghost"} className={cn("w-full justify-start font-mono transition-all duration-200 text-sm md:text-base", currentGame === game.id ? "bg-yellow-600 text-black hover:bg-yellow-700" : "text-gray-300 hover:text-white hover:bg-gray-700", collapsed ? "px-1 md:px-2" : "px-2 md:px-4", "min-h-[40px] md:min-h-[44px]")}>
            <span className="text-base md:text-lg mr-2 md:mr-3 flex-shrink-0">{game.emoji}</span>
            {!collapsed && <span className="truncate text-xs md:text-sm">{game.name}</span>}
          </Button>)}

        {/* Profile Button */}
        {user && <Button onClick={handleProfileClick} variant="ghost" className={cn("w-full justify-start font-mono transition-all duration-200 text-blue-400 hover:text-white hover:bg-blue-700/20 text-sm md:text-base", collapsed ? "px-1 md:px-2" : "px-2 md:px-4", "min-h-[40px] md:min-h-[44px]")}>
            <span className="text-base md:text-lg mr-2 md:mr-3 flex-shrink-0">👤</span>
            {!collapsed && <span className="truncate text-xs md:text-sm">My Profile</span>}
          </Button>}

        {/* Leaderboard Button */}
        <Button onClick={handleLeaderboardClick} variant="ghost" className={cn("w-full justify-start font-mono transition-all duration-200 text-yellow-400 hover:text-white hover:bg-yellow-700/20 text-sm md:text-base", collapsed ? "px-1 md:px-2" : "px-2 md:px-4", "min-h-[40px] md:min-h-[44px]")}>
          <span className="text-base md:text-lg mr-2 md:mr-3 flex-shrink-0">🏆</span>
          {!collapsed && <span className="truncate text-xs md:text-sm">Leaderboard</span>}
        </Button>

        {/* Admin Panel Link */}
        <Button onClick={handleAdminClick} variant="ghost" className={cn("w-full justify-start font-mono transition-all duration-200 text-red-400 hover:text-white hover:bg-red-700/20 text-sm md:text-base", collapsed ? "px-1 md:px-2" : "px-2 md:px-4", "min-h-[40px] md:min-h-[44px]")}>
          <span className="text-base md:text-lg mr-2 md:mr-3 flex-shrink-0">⚙️</span>
          {!collapsed && <span className="truncate text-xs md:text-sm">Admin Panel</span>}
        </Button>
      </div>

      {/* Footer */}
      <div className="p-2 md:p-4 border-t border-gray-700">
        {!collapsed && <div className="text-xs text-gray-500 font-mono text-center">
            © 2024 GrainBet
          </div>}
      </div>
    </div>;
};