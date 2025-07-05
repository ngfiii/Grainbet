
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
    const upperCode = code.toUpperCase().trim();
    console.log('=== REDEMPTION START ===');
    console.log('Code:', upperCode);
    console.log('User:', user?.id || 'anonymous');

    try {
      // Step 1: Get ALL keys with this code (don't filter by used status yet)
      console.log('Step 1: Fetching key data...');
      const { data: keys, error: fetchError } = await supabase
        .from('coin_keys')
        .select('*')
        .eq('code', upperCode);

      console.log('Fetch result:', { keys, fetchError });

      if (fetchError) {
        console.error('Database error:', fetchError);
        toast.error('Database error occurred');
        setLoading(false);
        return;
      }

      if (!keys || keys.length === 0) {
        console.log('No keys found with this code');
        toast.error('Invalid redemption code');
        setLoading(false);
        return;
      }

      const key = keys[0]; // Get the first (should be only) key
      console.log('Found key:', key);

      if (key.used) {
        console.log('Key is already used');
        toast.error('This code has already been redeemed');
        setLoading(false);
        return;
      }

      // Step 2: Mark as used with simple update
      console.log('Step 2: Marking key as used...');
      const { error: updateError } = await supabase
        .from('coin_keys')
        .update({ 
          used: true, 
          used_by: user?.id || 'anonymous',
          used_at: new Date().toISOString()
        })
        .eq('id', key.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Failed to process redemption');
        setLoading(false);
        return;
      }

      console.log('Key marked as used successfully');

      // Step 3: Add coins to balance
      console.log('Step 3: Adding coins to balance...');
      const actualAmount = onSuccess(key.amount);
      
      console.log('=== REDEMPTION SUCCESS ===');
      console.log('Amount added:', actualAmount);
      
      toast.success(`Successfully redeemed ${key.amount} coins!`);
      setCode('');
      onClose();

    } catch (error) {
      console.error('=== REDEMPTION ERROR ===');
      console.error('Unexpected error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && code.trim()) {
                  redeemKey();
                }
              }}
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
