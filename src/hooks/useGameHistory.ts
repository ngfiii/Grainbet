
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGameHistory = () => {
  const { user } = useAuth();

  const recordGameResult = async (
    gameType: string,
    betAmount: number,
    isWin: boolean,
    payout: number = 0,
    multiplier: number | null = null
  ) => {
    if (!user) {
      console.log('No user logged in, skipping game history recording');
      return;
    }

    try {
      console.log(`Recording ${gameType} game result:`, {
        betAmount,
        isWin,
        payout,
        multiplier,
        userId: user.id
      });

      // Record game history
      const { error: historyError } = await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: gameType,
          bet_amount: betAmount,
          is_win: isWin,
          payout: payout,
          multiplier: multiplier
        });

      if (historyError) {
        console.error('Error recording game history:', historyError);
        return;
      }

      // Update user stats using the database function
      const { error: statsError } = await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_bet_amount: betAmount,
        p_payout: payout,
        p_is_win: isWin,
        p_multiplier: multiplier
      });

      if (statsError) {
        console.error('Error updating user stats:', statsError);
      } else {
        console.log('Game result recorded successfully');
      }
    } catch (error) {
      console.error('Error in recordGameResult:', error);
    }
  };

  return { recordGameResult };
};
