
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { GameArea } from '@/components/GameArea';

export type Game = 'dice' | 'limbo' | 'blackjack' | 'mines' | 'keno' | 'plinko' | 'dashboard';

const Index = () => {
  const [currentGame, setCurrentGame] = useState<Game>('dashboard');
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('grainbet-balance');
    return saved ? parseFloat(saved) : 1000;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('grainbet-balance', balance.toString());
  }, [balance]);

  const updateBalance = (amount: number) => {
    setBalance(prev => Math.max(0, prev + amount));
  };

  const addCoins = (amount: number) => {
    setBalance(prev => Math.min(6900, prev + amount));
  };

  const deductCoins = (amount: number) => {
    setBalance(prev => Math.max(0, prev - amount));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Mobile overlay for sidebar */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      <Sidebar 
        currentGame={currentGame}
        onGameSelect={setCurrentGame}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          balance={balance}
          onAddCoins={addCoins}
          onDeductCoins={deductCoins}
        />
        
        <div className="flex-1 overflow-auto">
          <GameArea 
            currentGame={currentGame}
            balance={balance}
            onUpdateBalance={updateBalance}
            onGameSelect={setCurrentGame}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
