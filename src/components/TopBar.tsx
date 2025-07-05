
import { Coins, Plus, LogOut, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { RedeemModal } from './RedeemModal';
import { Link } from 'react-router-dom';

interface TopBarProps {
  balance: number;
  onAddCoins: (amount: number) => number;
  onDeductCoins: (amount: number) => number;
}

export const TopBar: React.FC<TopBarProps> = ({ balance, onAddCoins }) => {
  const { signOut, user } = useAuth();
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  
  const handleRedeemSuccess = (amount: number) => {
    const actualAmount = onAddCoins(amount);
    if (actualAmount <= 0) {
      toast.error("You've reached the maximum balance of 6900 coins!");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully!');
  };

  const isAdmin = user?.email === 'ngfi' || user?.id === 'ngfi';

  return (
    <>
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-yellow-400 md:hidden font-mono">GrainBet</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
            <Coins className="text-yellow-400" size={20} />
            <span className="font-bold text-lg font-mono">{balance.toFixed(0)}</span>
          </div>
          
          <Button 
            onClick={() => setShowRedeemModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 font-mono"
          >
            <Plus size={16} className="mr-1" />
            Redeem Coins
          </Button>

          <Link to="/credits">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 font-mono">
              <Circle size={16} className="mr-1" />
              Credits
            </Button>
          </Link>

          {isAdmin && (
            <Link to="/admin">
              <Button className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 font-mono">
                Admin Panel
              </Button>
            </Link>
          )}

          {user && (
            <Button
              onClick={handleSignOut}
              className="bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 font-mono"
            >
              <LogOut size={16} className="mr-1" />
              Sign Out
            </Button>
          )}
        </div>
      </div>

      <RedeemModal 
        isOpen={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        onSuccess={handleRedeemSuccess}
      />
    </>
  );
};
