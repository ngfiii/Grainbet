
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useGameHistory = () => {
  const { user } = useAuth();

  const recordGame = async (
    gameType: string,
    betAmount: number,
    payout: number,
    isWin: boolean,
    multiplier?: number
  ) => {
    if (!user) return;

    try {
      // Record in game history
      await supabase.from('game_history').insert({
        user_id: user.id,
        game_type: gameType,
        bet_amount: betAmount,
        payout: payout,
        is_win: isWin,
        multiplier: multiplier
      });

      // Update user stats
      await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_bet_amount: betAmount,
        p_payout: payout,
        p_is_win: isWin,
        p_multiplier: multiplier
      });
    } catch (error) {
      console.error('Error recording game:', error);
    }
  };

  return { recordGame };
};
