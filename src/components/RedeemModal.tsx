
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const redeemKey = async () => {
    if (!code.trim()) {
      toast.error('Please enter a redemption code');
      return;
    }

    setLoading(true);
    console.log('Starting redemption process for code:', code.toUpperCase());

    try {
      // First, let's get the key data
      const { data: keyData, error: fetchError } = await supabase
        .from('coin_keys')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      console.log('Key fetch result:', { keyData, fetchError });

      if (fetchError || !keyData) {
        console.error('Key not found:', fetchError);
        toast.error('Invalid redemption code');
        setLoading(false);
        return;
      }

      if (keyData.used) {
        console.log('Key already used');
        toast.error('This redemption code has already been used');
        setLoading(false);
        return;
      }

      console.log('Valid unused key found, amount:', keyData.amount);

      // Mark the key as used
      const { error: updateError } = await supabase
        .from('coin_keys')
        .update({ 
          used: true, 
          used_by: user?.id || 'anonymous', 
          used_at: new Date().toISOString() 
        })
        .eq('id', keyData.id);

      if (updateError) {
        console.error('Failed to update key status:', updateError);
        toast.error('Failed to redeem key - please try again');
        setLoading(false);
        return;
      }

      console.log('Key marked as used successfully');

      // Success! Add coins to balance
      onSuccess(keyData.amount);
      toast.success(`Successfully redeemed ${keyData.amount} coins!`);
      setCode('');
      onClose();

    } catch (error) {
      console.error('Redemption error:', error);
      toast.error('An error occurred while redeeming the key');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-sm w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-yellow-400 font-mono">Redeem Coins</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Redemption Code</label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter your code..."
              className="bg-gray-700 border-gray-600 text-white font-mono"
              maxLength={20}
            />
          </div>

          <Button
            onClick={redeemKey}
            disabled={loading || !code.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 transition-all duration-200 hover:scale-105 font-mono"
          >
            {loading ? 'Redeeming...' : 'Redeem Code'}
          </Button>
        </div>
      </div>
    </div>
  );
};
