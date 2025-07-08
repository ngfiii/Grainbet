
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, History, Trophy, Settings, Eye, EyeOff } from 'lucide-react';

interface GameHistoryEntry {
  id: string;
  game_type: string;
  bet_amount: number;
  payout: number;
  is_win: boolean;
  multiplier: number | null;
  created_at: string;
}

interface UserStats {
  total_bets: number;
  total_won: number;
  total_lost: number;
  biggest_win: number;
  current_win_streak: number;
  current_loss_streak: number;
  longest_win_streak: number;
  longest_loss_streak: number;
}

const Profile = () => {
  const { user, balance } = useAuth();
  const [username, setUsername] = useState('');
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchGameHistory();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setUsername(data?.username || '');
  };

  const fetchGameHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching game history:', error);
      return;
    }

    setGameHistory(data || []);
  };

  const fetchUserStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return;
    }

    setUserStats(data);
  };

  const updateUsername = async () => {
    if (!user || !username.trim()) {
      toast.error('Please enter a valid username');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update username');
      console.error('Error updating username:', error);
    } else {
      toast.success('Username updated successfully!');
    }

    setLoading(false);
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType.toLowerCase()) {
      case 'dice': return '🎲';
      case 'limbo': return '🚀';
      case 'blackjack': return '🃏';
      case 'mines': return '💣';
      case 'keno': return '🎯';
      case 'plinko': return '🟡';
      default: return '🎮';
    }
  };

  const formatGameType = (gameType: string) => {
    return gameType.charAt(0).toUpperCase() + gameType.slice(1);
  };

  const winRate = userStats && userStats.total_bets > 0 
    ? ((userStats.total_won / (userStats.total_won + userStats.total_lost)) * 100)
    : 0;

  const netProfit = userStats 
    ? userStats.total_won - userStats.total_lost
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img alt="GrainBet Logo" className="w-8 h-8" src="/lovable-uploads/b02b29fd-4df8-4fd3-83d6-52e449f3c4ab.png" />
            <h1 className="text-3xl font-bold text-yellow-400 font-mono">Profile</h1>
            <User className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="overview" className="font-mono">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="font-mono">
              <History className="w-4 h-4 mr-2" />
              Game History
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-mono">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">Player Overview</CardTitle>
                <CardDescription className="text-white">Your gaming statistics and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-750 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Username</div>
                      <div className="text-xl font-bold text-white font-mono">{username || 'Not set'}</div>
                    </div>
                    <div className="p-4 bg-gray-750 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-gray-400">Current Balance</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowBalance(!showBalance)}
                          className="text-gray-400 hover:text-white"
                        >
                          {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="text-2xl font-bold text-green-400 font-mono">
                        {showBalance ? `${balance?.toFixed(2)} coins` : '••••••'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-750 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Email</div>
                      <div className="text-base text-white font-mono">{user.email}</div>
                    </div>
                    <div className="p-4 bg-gray-750 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Member Since</div>
                      <div className="text-base text-white font-mono">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-750 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400 font-mono">
                          {userStats?.total_bets || 0}
                        </div>
                        <div className="text-sm text-gray-400">Total Bets</div>
                      </div>
                      <div className="p-4 bg-gray-750 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-400 font-mono">
                          {userStats?.biggest_win || 0}
                        </div>
                        <div className="text-sm text-gray-400">Biggest Win</div>
                      </div>
                      <div className="p-4 bg-gray-750 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-400 font-mono">
                          {userStats?.longest_win_streak || 0}
                        </div>
                        <div className="text-sm text-gray-400">Best Streak</div>
                      </div>
                      <div className="p-4 bg-gray-750 rounded-lg text-center">
                        <div className="text-2xl font-bold text-cyan-400 font-mono">
                          {winRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Win Rate</div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-750 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Current Streaks</div>
                      <div className="flex justify-between">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400 font-mono">
                            {userStats?.current_win_streak || 0}
                          </div>
                          <div className="text-xs text-gray-400">Win Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400 font-mono">
                            {userStats?.current_loss_streak || 0}
                          </div>
                          <div className="text-xs text-gray-400">Loss Streak</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-750 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Net Profit</div>
                      <div className={`text-2xl font-bold font-mono ${
                        netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} coins
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400 font-mono flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Game History
                </CardTitle>
                <CardDescription className="text-white">Your recent gaming activity</CardDescription>
              </CardHeader>
              <CardContent>
                {gameHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">No games played yet</div>
                    <div className="text-sm text-gray-500">Start playing to see your history here!</div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {gameHistory.map((entry) => (
                      <div key={entry.id} className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getGameIcon(entry.game_type)}</div>
                            <div>
                              <div className="font-bold text-white font-mono">
                                {formatGameType(entry.game_type)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(entry.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold font-mono ${
                              entry.is_win ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {entry.is_win ? '+' : '-'}{Math.abs(entry.payout - entry.bet_amount).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-400">
                              Bet: {entry.bet_amount} | {entry.multiplier ? `${entry.multiplier.toFixed(2)}x` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 font-mono flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription className="text-white">Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Username</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      onClick={updateUsername}
                      disabled={loading || !username.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-750 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Account Information</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Email:</span>
                      <span className="text-white font-mono">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Member Since:</span>
                      <span className="text-white font-mono">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Account ID:</span>
                      <span className="text-white font-mono text-xs">{user.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
