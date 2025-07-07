
import { Coins, Plus, LogOut, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { RedeemModal } from './RedeemModal';
import { TipModal } from './TipModal';

interface TopBarProps {
  balance: number;
  onAddCoins: (amount: number) => number;
  onDeductCoins: (amount: number) => number;
}

export const TopBar: React.FC<TopBarProps> = ({ balance, onAddCoins, onDeductCoins }) => {
  const { signOut, user } = useAuth();
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  
  const handleRedeemSuccess = (amount: number) => {
    const actualAmount = onAddCoins(amount);
    if (actualAmount <= 0) {
      toast.error("You've reached the maximum balance of 6900 coins!");
    }
  };

  const handleTipSent = (amount: number) => {
    onDeductCoins(amount);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully!');
  };

  const handleFreeCoins = () => {
    window.open('https://lootdest.org/s?TMyWVEiJ', '_blank');
  };

  return (
    <>
      <div className="bg-gray-800 border-b border-gray-700 p-2 md:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-yellow-400 md:hidden font-mono">GrainBet</h1>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-4">
          <div className="flex items-center space-x-1 md:space-x-2 bg-gray-700 px-2 md:px-4 py-1 md:py-2 rounded-lg">
            <Coins className="text-yellow-400" size={16} />
            <span className="font-bold text-sm md:text-lg font-mono">{balance.toFixed(0)}</span>
          </div>

          <Button 
            onClick={() => setShowTipModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 font-mono text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
          >
            <Plus size={12} className="mr-1" />
            <span className="hidden sm:inline">Tip User</span>
            <span className="sm:hidden">Tip</span>
          </Button>
          
          <Button 
            onClick={() => setShowRedeemModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 font-mono text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
          >
            <Plus size={12} className="mr-1" />
            <span className="hidden sm:inline">Redeem Coins</span>
            <span className="sm:hidden">Redeem</span>
          </Button>

          <Button 
            onClick={handleFreeCoins}
            className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 font-mono text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
          >
            <Gift size={12} className="mr-1" />
            <span className="hidden sm:inline">Free coins</span>
            <span className="sm:hidden">Free</span>
          </Button>

          {user && (
            <Button
              onClick={handleSignOut}
              className="bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 font-mono text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
            >
              <LogOut size={12} className="mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          )}
        </div>
      </div>

      <RedeemModal 
        isOpen={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        onSuccess={handleRedeemSuccess}
      />

      <TipModal 
        isOpen={showTipModal} 
        onClose={() => setShowTipModal(false)}
        onTipSent={handleTipSent}
        balance={balance}
      />
    </>
  );
};
