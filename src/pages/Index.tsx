
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { GameArea } from '@/components/GameArea';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type Game = 'dice' | 'limbo' | 'blackjack' | 'mines' | 'keno' | 'plinko' | 'dashboard';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { balance, addCoins, deductCoins, updateBalance } = useBalance();
  const navigate = useNavigate();
  const [currentGame, setCurrentGame] = useState<Game>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Dynamic page title effect
  useEffect(() => {
    document.title = 'GrainBet';
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/lovable-uploads/fd6e96d2-a80d-4fd1-a06f-0c3acbef3fb5.png" 
              alt="GrainBet Logo" 
              className="w-8 h-8"
            />
            <div className="text-2xl font-bold text-yellow-400 font-mono">GrainBet</div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-300 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/lovable-uploads/fd6e96d2-a80d-4fd1-a06f-0c3acbef3fb5.png" 
              alt="GrainBet Logo" 
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 font-mono">GrainBet</h1>
          </div>
          <p className="text-gray-300 mb-6 md:mb-8 font-mono text-sm md:text-base">
            Sign up or log in to start playing games and earning coins!
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-6 md:px-8 text-base md:text-lg font-mono w-full md:w-auto"
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row overflow-hidden">
      {/* Mobile overlay for sidebar */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      <Sidebar 
        currentGame={currentGame}
        onGameSelect={(game) => {
          setCurrentGame(game);
          if (isMobile) setSidebarCollapsed(true);
        }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
