
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      // For non-authenticated users, use localStorage as fallback
      const saved = localStorage.getItem('grainbet-balance');
      setBalance(saved ? parseFloat(saved) : 50);
      setLoading(false);
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching balance for user:', user.id);
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
        console.log('Fetched balance:', data.balance);
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
    console.log('Updating balance from', balance, 'to', newBalance, 'change:', amount);
    
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
        
        console.log('Balance updated successfully in database');
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
    console.log('Adding coins:', amount, 'current balance:', balance);
    const maxAllowed = 6900;
    const newBalance = balance + amount;
    
    if (newBalance > maxAllowed) {
      const actualAmount = maxAllowed - balance;
      console.log('Hit max balance, only adding:', actualAmount);
      if (actualAmount > 0) {
        updateBalance(actualAmount);
      }
      return actualAmount;
    }
    
    updateBalance(amount);
    return amount;
  };

  const deductCoins = (amount: number) => {
    console.log('Deducting coins:', amount, 'current balance:', balance);
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
