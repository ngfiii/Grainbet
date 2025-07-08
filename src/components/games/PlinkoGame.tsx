
import { Construction } from 'lucide-react';

interface GameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

export const PlinkoGame: React.FC<GameProps> = ({ balance, onUpdateBalance }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-12 rounded-lg border border-gray-700 shadow-2xl text-center">
        <Construction size={120} className="mx-auto text-yellow-400 mb-6" />
        
        <h2 className="text-4xl font-bold text-yellow-400 mb-4 font-mono">🟡 Plinko</h2>
        
        <div className="text-xl text-gray-300 mb-6 font-mono">
          Under Construction
        </div>
        
        <div className="text-gray-400 font-mono max-w-md mx-auto">
          This game is currently being developed with enhanced physics and improved gameplay. 
          Check back soon for an amazing Plinko experience!
        </div>
        
        <div className="mt-8 text-sm text-gray-500 font-mono">
          🚧 Coming Soon 🚧
        </div>
      </div>
    </div>
  );
};
