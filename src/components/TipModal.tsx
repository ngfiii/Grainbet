
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTipSent: (amount: number) => void;
}

export const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, onTipSent }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [userValid, setUserValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (username.trim().length > 0) {
      checkUser();
    } else {
      setUserValid(null);
    }
  }, [username]);

  const checkUser = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      setUserValid(!!data);
    } catch {
      setUserValid(false);
    }
  };

  const sendTip = async () => {
    if (!userValid || amount <= 0) return;

    setLoading(true);
    try {
      // Get recipient user ID
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      if (!recipient) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      // Get current user balance
      const { data: senderBalance } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', user?.id)
        .single();

      if (!senderBalance || senderBalance.balance < amount) {
        toast.error('Insufficient balance');
        setLoading(false);
        return;
      }

      // Get recipient balance
      const { data: recipientBalance } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', recipient.id)
        .single();

      // Update sender balance
      await supabase
        .from('user_balances')
        .update({ balance: senderBalance.balance - amount })
        .eq('id', user?.id);

      // Update recipient balance
      await supabase
        .from('user_balances')
        .update({ balance: (recipientBalance?.balance || 0) + amount })
        .eq('id', recipient.id);

      onTipSent(amount);
      toast.success(`Successfully sent ${amount} coins to ${username}!`);
      setUsername('');
      setAmount(10);
      onClose();
    } catch (error) {
      toast.error('Failed to send tip');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-sm w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-yellow-400 font-mono">Send Tip</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="bg-gray-700 border-gray-600 text-white font-mono"
            />
            {userValid === true && (
              <p className="text-green-400 text-sm mt-1">✓ Valid user</p>
            )}
            {userValid === false && (
              <p className="text-red-400 text-sm mt-1">✗ User not found</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white font-mono"
              min={1}
            />
          </div>

          <Button
            onClick={sendTip}
            disabled={loading || !userValid || amount <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 transition-all duration-200 hover:scale-105 font-mono"
          >
            {loading ? 'Sending...' : `Send ${amount} Coins`}
          </Button>
        </div>
      </div>
    </div>
  );
};
