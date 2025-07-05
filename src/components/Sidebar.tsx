
import { Menu, X, Home, Dice1, Rocket, Spade, Bomb, Target, Circle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Game } from '@/pages/Index';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AdminAuthModal } from './AdminAuthModal';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  currentGame: Game;
  onGameSelect: (game: Game) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const games = [
  { id: 'dashboard' as Game, name: 'Dashboard', icon: Home, emoji: '🏠' },
  { id: 'dice' as Game, name: 'Dice', icon: Dice1, emoji: '🎮' },
  { id: 'limbo' as Game, name: 'Limbo', icon: Rocket, emoji: '🚀' },
  { id: 'blackjack' as Game, name: 'Blackjack', icon: Spade, emoji: '♠️' },
  { id: 'mines' as Game, name: 'Mines', icon: Bomb, emoji: '💣' },
  { id: 'keno' as Game, name: 'Keno', icon: Target, emoji: '🎯' },
  { id: 'plinko' as Game, name: 'Plinko', icon: Circle, emoji: '🟡' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentGame,
  onGameSelect,
  collapsed,
  onToggle
}) => {
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const navigate = useNavigate();

  const handleAdminClick = () => {
    setShowAdminAuth(true);
  };

  const handleAdminAuthSuccess = () => {
    navigate('/admin');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col z-50",
        "fixed md:relative h-full md:h-auto",
        collapsed ? "w-16 -translate-x-full md:translate-x-0" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-2xl font-bold text-yellow-400">GrainBet</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {games.map((game) => (
              <li key={game.id}>
                <button
                  onClick={() => onGameSelect(game.id)}
                  className={cn(
                    "w-full flex items-center p-3 rounded-lg transition-all duration-200",
                    "hover:bg-gray-700 hover:scale-105",
                    currentGame === game.id 
                      ? "bg-yellow-600 text-black font-semibold shadow-lg" 
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  <span className="text-xl mr-3">{game.emoji}</span>
                  {!collapsed && (
                    <span className="font-medium">{game.name}</span>
                  )}
                </button>
              </li>
            ))}
            
            {/* Admin Panel - Always visible but requires authentication */}
            <li>
              <button
                onClick={handleAdminClick}
                className="w-full flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-700 hover:scale-105 text-gray-300 hover:text-white"
              >
                <span className="text-xl mr-3">⚙️</span>
                {!collapsed && (
                  <span className="font-medium">Admin Panel</span>
                )}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <AdminAuthModal
        isOpen={showAdminAuth}
        onClose={() => setShowAdminAuth(false)}
        onSuccess={handleAdminAuthSuccess}
      />
    </>
  );
};
