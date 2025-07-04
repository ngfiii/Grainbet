
import { Coins, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  balance: number;
  onAddCoins: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ balance, onAddCoins }) => {
  return (
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
          onClick={onAddCoins}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus size={16} className="mr-1" />
          Free Coins
        </Button>
      </div>
    </div>
  );
};
