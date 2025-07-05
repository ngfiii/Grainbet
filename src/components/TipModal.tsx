
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTipSent: (amount: number) => void;
  balance: number;
}

export const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, onTipSent, balance }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [userValidation, setUserValidation] = useState<'valid' | 'invalid' | 'none'>('none');

  const validateUser = async (username: string) => {
    if (!username.trim()) {
      setUserValidation('none');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', username.trim())
        .single();

      if (error || !data) {
        setUserValidation('invalid');
      } else {
        setUserValidation('valid');
      }
    } catch (error) {
      setUserValidation('invalid');
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateUser(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const sendTip = async () => {
    if (!user || amount > balance || amount < 1 || userValidation !== 'valid') return;

    setLoading(true);
    try {
      // Get recipient user ID
      const { data: recipient, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username.trim())
        .single();

      if (recipientError || !recipient) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      if (recipient.id === user.id) {
        toast.error('You cannot tip yourself');
        setLoading(false);
        return;
      }

      // Update recipient balance
      const { data: recipientBalance, error: getBalanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', recipient.id)
        .single();

      if (getBalanceError) {
        toast.error('Error processing tip');
        setLoading(false);
        return;
      }

      const newRecipientBalance = Math.min(6900, recipientBalance.balance + amount);
      const actualTipAmount = newRecipientBalance - recipientBalance.balance;

      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ balance: newRecipientBalance })
        .eq('id', recipient.id);

      if (updateError) {
        toast.error('Error processing tip');
        setLoading(false);
        return;
      }

      // Deduct from sender
      onTipSent(actualTipAmount);
      
      toast.success(`Successfully tipped ${actualTipAmount} coins to ${username}!`);
      onClose();
      setUsername('');
      setAmount(10);
      setUserValidation('none');
    } catch (error) {
      toast.error('Error sending tip');
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 font-mono">Tip User</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter username to tip"
              className="bg-gray-700 border-gray-600 text-white font-mono"
            />
            {userValidation === 'valid' && (
              <p className="text-green-400 text-sm mt-1 font-mono">✓ Valid user</p>
            )}
            {userValidation === 'invalid' && (
              <p className="text-red-400 text-sm mt-1 font-mono">✗ User not found</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Tip Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(balance, parseInt(e.target.value) || 1)))}
              min={1}
              max={balance}
              className="bg-gray-700 border-gray-600 text-white font-mono"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={sendTip}
              disabled={loading || amount > balance || amount < 1 || userValidation !== 'valid' || !username.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-mono"
            >
              {loading ? 'Sending...' : `Send Tip (${amount} coins)`}
            </Button>
            <Button onClick={onClose} variant="outline" className="font-mono">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
