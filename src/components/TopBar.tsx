
import { Coins, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface TopBarProps {
  balance: number;
  onAddCoins: (amount: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ balance, onAddCoins }) => {
  const [showCoinModal, setShowCoinModal] = useState(false);
  
  const coinOptions = [5, 10, 20, 50, 100, 500];
  
  const handleAddCoins = (amount: number) => {
    onAddCoins(amount);
    setShowCoinModal(false);
    toast.success(`${amount} coins added to your balance!`);
  };

  return (
    <>
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-yellow-400 md:hidden">GrainBet</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
            <Coins className="text-yellow-400" size={20} />
            <span className="font-bold text-lg">{balance.toFixed(0)}</span>
          </div>
          
          <Button 
            onClick={() => setShowCoinModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
          >
            <Plus size={16} className="mr-1" />
            Free Coins
          </Button>
        </div>
      </div>

      {/* Free Coins Modal */}
      {showCoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-sm w-full mx-4 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-400">Choose Free Coins</h3>
              <button 
                onClick={() => setShowCoinModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {coinOptions.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => handleAddCoins(amount)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 transition-all duration-200 hover:scale-105"
                >
                  {amount} Coins
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
