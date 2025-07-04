
import { Coins, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

interface TopBarProps {
  balance: number;
  onAddCoins: (amount: number) => void;
  onDeductCoins: (amount: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ balance, onAddCoins, onDeductCoins }) => {
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'deduct'>('add');
  const [customAmount, setCustomAmount] = useState(100);
  
  const coinOptions = [5, 10, 20, 50, 100, 500];
  
  const handleCoins = (amount: number) => {
    if (modalType === 'add') {
      const maxAllowed = 6900 - balance;
      const actualAmount = Math.min(amount, maxAllowed);
      if (actualAmount <= 0) {
        toast.error("You've reached the maximum balance of 6900 coins!");
        setShowCoinModal(false);
        return;
      }
      onAddCoins(actualAmount);
      toast.success(`${actualAmount} coins added to your balance!`);
    } else {
      const actualAmount = Math.min(amount, balance);
      if (actualAmount <= 0) {
        toast.error("Insufficient balance!");
        setShowCoinModal(false);
        return;
      }
      onDeductCoins(actualAmount);
      toast.success(`${actualAmount} coins deducted from your balance!`);
    }
    setShowCoinModal(false);
  };

  const handleCustomAmount = () => {
    if (modalType === 'add') {
      const maxAllowed = 6900 - balance;
      const actualAmount = Math.min(customAmount, maxAllowed);
      if (actualAmount <= 0) {
        toast.error("You've reached the maximum balance of 6900 coins!");
        setShowCoinModal(false);
        return;
      }
      handleCoins(actualAmount);
    } else {
      handleCoins(customAmount);
    }
  };

  const openModal = (type: 'add' | 'deduct') => {
    setModalType(type);
    setShowCoinModal(true);
  };

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
            onClick={() => openModal('add')}
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 font-mono"
          >
            <Plus size={16} className="mr-1" />
            Add Coins
          </Button>

          <Button 
            onClick={() => openModal('deduct')}
            className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 font-mono"
          >
            <Minus size={16} className="mr-1" />
            Remove Coins
          </Button>
        </div>
      </div>

      {/* Coin Modal */}
      {showCoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-sm w-full mx-4 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-400 font-mono">
                {modalType === 'add' ? 'Add Coins' : 'Remove Coins'}
              </h3>
              <button 
                onClick={() => setShowCoinModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {coinOptions.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => handleCoins(amount)}
                  className={`${
                    modalType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  } text-white font-bold py-3 transition-all duration-200 hover:scale-105 font-mono`}
                >
                  {amount} Coins
                </Button>
              ))}
            </div>

            <div className="border-t border-gray-600 pt-4">
              <label className="block text-sm font-medium mb-2 font-mono">Custom Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                  max={modalType === 'add' ? 6900 - balance : balance}
                />
                <Button
                  onClick={handleCustomAmount}
                  className={`${
                    modalType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  } text-white font-mono`}
                >
                  {modalType === 'add' ? 'Add' : 'Remove'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
