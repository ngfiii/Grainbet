import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Settings, BarChart3, History, Trophy, Target, Zap, Calendar } from 'lucide-react';

interface GameHistory {
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
  longest_win_streak: number;
  longest_loss_streak: number;
  current_win_streak: number;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const { balance } = useBalance();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGameHistory();
      fetchUserStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setUsername(data.username || '');
    }
  };

  const fetchGameHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setGameHistory(data);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setUserStats(data);
    }
  };

  const updateUsername = async () => {
    if (!user || !username.trim()) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id);
    
    if (error) {
      toast.error('Failed to update username');
    } else {
      toast.success('Username updated successfully');
      setIsEditing(false);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'dice': return '🎲';
      case 'limbo': return '🚀';
      case 'blackjack': return '🃏';
      case 'mines': return '💣';
      case 'keno': return '🎯';
      case 'plinko': return '🟡';
      default: return '🎮';
    }
  };

  const winRate = userStats && userStats.total_bets > 0 
    ? ((userStats.total_won / (userStats.total_won + userStats.total_lost)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img alt="GrainBet Logo" className="w-8 h-8" src="/lovable-uploads/b02b29fd-4df8-4fd3-83d6-52e449f3c4ab.png" />
            <h1 className="text-3xl font-bold text-green-400 font-mono">Profile</h1>
            <User className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-gray-800">
            <TabsTrigger value="overview" className="font-mono">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="font-mono">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-mono">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-mono">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Overview
                </CardTitle>
                <CardDescription className="text-gray-300">
                  View your profile information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400 font-mono">
                      {balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Current Balance</div>
                  </div>
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
                    <div className="text-sm text-gray-400">Best Win Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Game History
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your recent game history and results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gameHistory.map((game) => (
                    <div key={game.id} className="p-3 bg-gray-750 rounded-lg border border-gray-600 text-sm">
                      <div className="flex justify-between items-center">
                        <div className="font-mono">
                          <div className="font-medium">
                            {getGameIcon(game.game_type)} {game.game_type}
                          </div>
                          <div className="text-gray-400">
                            Bet: {game.bet_amount} | Payout: {game.payout}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(game.created_at)}
                        </div>
                      </div>
                      <div className={game.is_win ? "text-green-400" : "text-red-400"}>
                        {game.is_win ? "Win" : "Loss"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 font-mono flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistics
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Detailed statistics about your gameplay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-400 font-mono">
                      {balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Current Balance</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-400 font-mono">
                      {userStats?.total_bets || 0}
                    </div>
                    <div className="text-sm text-gray-400">Total Bets</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-yellow-400 font-mono">
                      {winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-orange-400 font-mono">
                      {userStats?.current_win_streak || 0}
                    </div>
                    <div className="text-sm text-gray-400">Current Win Streak</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-pink-400 font-mono">
                      {userStats?.biggest_win || 0}
                    </div>
                    <div className="text-sm text-gray-400">Biggest Win</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-cyan-400 font-mono">
                      {userStats?.longest_win_streak || 0}
                    </div>
                    <div className="text-sm text-gray-400">Longest Win Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400 font-mono flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your account preferences and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Username</label>
                    <div className="flex gap-2">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Enter username"
                      />
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button 
                            onClick={updateUsername} 
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button 
                            onClick={() => setIsEditing(false)} 
                            variant="outline"
                            className="border-gray-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          className="border-gray-600"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Email</label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Member Since</label>
                    <Input
                      value={user?.created_at ? formatDate(user.created_at) : ''}
                      disabled
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">User ID</label>
                    <Input
                      value={user?.id || ''}
                      disabled
                      className="bg-gray-700 border-gray-600 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-600">
                  <Button 
                    onClick={logout}
                    variant="destructive"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
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
