
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { GameArea } from '@/components/GameArea';

export type Game = 'dice' | 'limbo' | 'blackjack' | 'mines' | 'keno' | 'plinko' | 'dashboard';

const Index = () => {
  const [currentGame, setCurrentGame] = useState<Game>('dashboard');
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('grainbet-balance');
    return saved ? parseFloat(saved) : 1000; // Start with 1000 virtual coins
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('grainbet-balance', balance.toString());
  }, [balance]);

  const updateBalance = (amount: number) => {
    setBalance(prev => Math.max(0, prev + amount));
  };

  const addFreeCoins = (amount: number = 1000) => {
    setBalance(prev => prev + amount);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar 
        currentGame={currentGame}
        onGameSelect={setCurrentGame}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col">
        <TopBar 
          balance={balance}
          onAddCoins={addFreeCoins}
        />
        
        <GameArea 
          currentGame={currentGame}
          balance={balance}
          onUpdateBalance={updateBalance}
        />
      </div>
    </div>
  );
};

export default Index;
