
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useGameStats = () => {
  const { user } = useAuth();

  const recordGameResult = async (
    gameType: string,
    betAmount: number,
    payout: number,
    isWin: boolean,
    multiplier?: number
  ) => {
    if (!user) return;

    try {
      // Record game history
      await supabase.from('game_history').insert({
        user_id: user.id,
        game_type: gameType,
        bet_amount: betAmount,
        payout: payout,
        is_win: isWin,
        multiplier: multiplier
      });

      // Update user stats using the database function
      await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_bet_amount: betAmount,
        p_payout: payout,
        p_is_win: isWin,
        p_multiplier: multiplier
      });

      console.log('Game stats recorded successfully');
    } catch (error) {
      console.error('Error recording game stats:', error);
    }
  };

  return { recordGameResult };
};
