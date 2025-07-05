
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(50); // Changed from 1000 to 50
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      // For non-authenticated users, use localStorage as fallback
      const saved = localStorage.getItem('grainbet-balance');
      setBalance(saved ? parseFloat(saved) : 50); // Changed from 1000 to 50
      setLoading(false);
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        return;
      }

      if (data) {
        setBalance(parseFloat(data.balance.toString()));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (amount: number) => {
    const newBalance = Math.max(0, balance + amount);
    
    if (user) {
      try {
        const { error } = await supabase
          .from('user_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating balance:', error);
          return;
        }
      } catch (error) {
        console.error('Error updating balance:', error);
        return;
      }
    } else {
      localStorage.setItem('grainbet-balance', newBalance.toString());
    }
    
    setBalance(newBalance);
  };

  const addCoins = (amount: number) => {
    const maxAllowed = user ? 6900 : 6900;
    const actualAmount = Math.min(amount, maxAllowed - balance);
    if (actualAmount > 0) {
      updateBalance(actualAmount);
    }
    return actualAmount;
  };

  const deductCoins = (amount: number) => {
    const actualAmount = Math.min(amount, balance);
    if (actualAmount > 0) {
      updateBalance(-actualAmount);
    }
    return actualAmount;
  };

  return {
    balance,
    loading,
    updateBalance,
    addCoins,
    deductCoins,
    fetchBalance
  };
};
