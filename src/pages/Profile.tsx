import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Settings, Trophy, History, Lock } from 'lucide-react';

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

interface GameHistoryItem {
  id: string;
  game_type: string;
  bet_amount: number;
  payout: number;
  is_win: boolean;
  multiplier: number | null;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ username: string; balance: number } | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserStats();
      fetchGameHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const { data: balanceData } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', user.id)
      .single();

    setProfile({
      username: profileData?.username || 'Unknown',
      balance: balanceData?.balance || 0
    });
    setNewUsername(profileData?.username || '');
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

  const fetchGameHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching game history:', error);
      return;
    }

    setGameHistory(data || []);
  };

  const updateUsername = async () => {
    if (!user || !newUsername.trim()) {
      toast.error('Please enter a valid username');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername.trim() })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update username');
    } else {
      toast.success('Username updated successfully');
      setProfile(prev => prev ? { ...prev, username: newUsername.trim() } : null);
    }
    setLoading(false);
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error('Failed to update password: ' + error.message);
    } else {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300">Please log in to view your profile.</p>
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
            <h1 className="text-3xl font-bold text-yellow-400 font-mono">My Profile</h1>
          </div>
          <p className="text-gray-300 font-mono">Manage your account and view your gaming statistics</p>
        </div>

        {/* Profile Overview */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-750 rounded-lg">
                <div className="text-2xl font-bold text-green-400 font-mono">{profile?.balance || 0}</div>
                <div className="text-sm text-gray-400">Current Balance</div>
              </div>
              <div className="text-center p-4 bg-gray-750 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 font-mono">{userStats?.total_bets || 0}</div>
                <div className="text-sm text-gray-400">Total Bets</div>
              </div>
              <div className="text-center p-4 bg-gray-750 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 font-mono">{userStats?.biggest_win || 0}</div>
                <div className="text-sm text-gray-400">Biggest Win</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-gray-800">
            <TabsTrigger value="stats" className="font-mono text-sm">
              <Trophy className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="history" className="font-mono text-sm">
              <History className="w-4 h-4 mr-2" />
              Game History
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-mono text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="font-mono text-sm">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">Gaming Statistics</CardTitle>
                <CardDescription>Your complete gaming performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-400 font-mono">{userStats?.total_won || 0}</div>
                    <div className="text-sm text-gray-400">Total Won</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-400 font-mono">{userStats?.total_lost || 0}</div>
                    <div className="text-sm text-gray-400">Total Lost</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-400 font-mono">{userStats?.current_win_streak || 0}</div>
                    <div className="text-sm text-gray-400">Current Win Streak</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-orange-400 font-mono">{userStats?.current_loss_streak || 0}</div>
                    <div className="text-sm text-gray-400">Current Loss Streak</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-yellow-400 font-mono">{userStats?.longest_win_streak || 0}</div>
                    <div className="text-sm text-gray-400">Longest Win Streak</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-pink-400 font-mono">{userStats?.longest_loss_streak || 0}</div>
                    <div className="text-sm text-gray-400">Longest Loss Streak</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-cyan-400 font-mono">
                      {userStats?.total_bets ? ((userStats.total_won / (userStats.total_won + userStats.total_lost)) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                  <div className="p-4 bg-gray-750 rounded-lg text-center">
                    <div className="text-xl font-bold text-indigo-400 font-mono">
                      {userStats ? (userStats.total_won - userStats.total_lost).toFixed(0) : 0}
                    </div>
                    <div className="text-sm text-gray-400">Net Profit/Loss</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400 font-mono">Recent Games</CardTitle>
                <CardDescription>Your last 20 games played</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gameHistory.length > 0 ? (
                    gameHistory.map((game) => (
                      <div
                        key={game.id}
                        className={`p-3 rounded-lg border ${
                          game.is_win ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-mono">
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-medium">{game.game_type}</span>
                              <span className={`text-sm px-2 py-1 rounded ${
                                game.is_win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {game.is_win ? 'WIN' : 'LOSS'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              Bet: {game.bet_amount} • Payout: {game.payout}
                              {game.multiplier && ` • ${game.multiplier}x`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-bold ${
                              game.is_win ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {game.is_win ? '+' : '-'}{Math.abs(game.payout - game.bet_amount).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(game.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No games played yet. Start playing to see your history!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 font-mono">Account Settings</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-mono mb-2">Username</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white font-mono flex-1"
                      placeholder="Enter new username"
                    />
                    <Button
                      onClick={updateUsername}
                      disabled={loading || !newUsername.trim() || newUsername === profile?.username}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-750 rounded-lg">
                  <h4 className="font-mono text-yellow-400 mb-2">Current Profile</h4>
                  <div className="text-sm space-y-1 text-white">
                    <div><strong>Username:</strong> {profile?.username}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-red-400 font-mono">Security Settings</CardTitle>
                <CardDescription>Update your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-mono mb-2">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono mb-2">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono mb-2">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={updatePassword}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
