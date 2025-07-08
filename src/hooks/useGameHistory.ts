
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useGameHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const recordGame = async (
    gameType: string,
    betAmount: number,
    payout: number,
    isWin: boolean,
    multiplier?: number
  ) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Record game history
      const { error: historyError } = await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: gameType,
          bet_amount: betAmount,
          payout: payout,
          is_win: isWin,
          multiplier: multiplier || null
        });

      if (historyError) {
        console.error('Error recording game history:', historyError);
        return;
      }

      // Update user stats
      const { error: statsError } = await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_bet_amount: betAmount,
        p_payout: payout,
        p_is_win: isWin,
        p_multiplier: multiplier || null
      });

      if (statsError) {
        console.error('Error updating user stats:', statsError);
      }
    } catch (error) {
      console.error('Error in recordGame:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { recordGame, isLoading };
};
