
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
    let interval: NodeJS.Timeout;

    const updateTitle = () => {
      let showGrainbet = true;
      
      const switchTitle = () => {
        if (showGrainbet) {
          document.title = 'GrainBet';
          setTimeout(() => {
            showGrainbet = false;
            switchTitle();
          }, 3000); // Show GrainBet for 3 seconds
        } else {
          document.title = 'Ngfi on dc';
          setTimeout(() => {
            showGrainbet = true;
            switchTitle();
          }, 5000); // Show Ngfi on dc for 5 seconds
        }
      };
      
      switchTitle();
    };

    updateTitle();

    return () => {
      if (interval) clearInterval(interval);
      document.title = 'GrainBet'; // Reset to default on cleanup
    };
  }, []);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-4 font-mono">GrainBet</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-300 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4 font-mono">Welcome to GrainBet!</h1>
          <p className="text-gray-300 mb-8 font-mono">
            Sign up or log in to start playing games and earning coins!
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 text-lg font-mono"
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

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
