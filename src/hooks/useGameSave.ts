
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useGameSave = (gameType: string) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const saveGameState = async (gameData: any) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { error } = await (supabase as any)
        .from('game_saves')
        .upsert({
          user_id: user.id,
          game_type: gameType,
          game_data: gameData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving game state:', error);
      } else {
        console.log('Game state saved successfully');
      }
    } catch (error) {
      console.error('Error saving game state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGameState = async () => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('game_saves')
        .select('game_data')
        .eq('user_id', user.id)
        .eq('game_type', gameType)
        .maybeSingle();

      if (error) {
        console.error('Error loading game state:', error);
        return null;
      }

      return data?.game_data || null;
    } catch (error) {
      console.error('Error loading game state:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearGameState = async () => {
    if (!user) return;
    
    try {
      const { error } = await (supabase as any)
        .from('game_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('game_type', gameType);

      if (error) {
        console.error('Error clearing game state:', error);
      } else {
        console.log('Game state cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing game state:', error);
    }
  };

  return {
    saveGameState,
    loadGameState,
    clearGameState,
    isLoading
  };
};
