
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Key, Settings, Trash2, UserPlus, Coins, Shield, Database, Zap, TrendingUp } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  balance: number;
  total_bets: number;
  biggest_win: number;
  created_at: string;
}

interface CoinKey {
  id: string;
  code: string;
  amount: number;
  used: boolean;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
}

const AdminPanel = () => {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [coinKeys, setCoinKeys] = useState<CoinKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyAmount, setKeyAmount] = useState<number>(100);
  const [keyCount, setKeyCount] = useState<number>(1);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [balanceAmount, setBal

anceAmount] = useState<number>(0);

  useEffect(() => {
    fetchUserProfiles();
    fetchCoinKeys();
  }, []);

  const fetchUserProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        created_at
      `);
    
    if (error) {
      toast.error('Failed to fetch user profiles');
      console.error('Error fetching profiles:', error);
      return;
    }

    // Get balances and stats separately
    const { data: balanceData } = await supabase
      .from('user_balances')
      .select('id, balance');

    const { data: statsData } = await supabase
      .from('user_stats')
      .select('user_id, total_bets, biggest_win');
    
    const formattedData = data?.map(user => {
      const balance = balanceData?.find(b => b.id === user.id)?.balance || 0;
      const stats = statsData?.find(s => s.user_id === user.id);
      
      return {
        id: user.id,
        username: user.username || 'Unknown',
        balance: balance,
        total_bets: stats?.total_bets || 0,
        biggest_win: stats?.biggest_win || 0,
        created_at: user.created_at
      };
    }) || [];
    
    setUserProfiles(formattedData);
  };

  const fetchCoinKeys = async () => {
    const { data, error } = await supabase
      .from('coin_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch coin keys');
      return;
    }
    
    setCoinKeys(data || []);
  };

  const generateCoinKeys = async () => {
    setLoading(true);
    const keys = [];
    
    for (let i = 0; i < keyCount; i++) {
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      keys.push({
        code,
        amount: keyAmount
      });
    }
    
    const { error } = await supabase
      .from('coin_keys')
      .insert(keys);
    
    if (error) {
      toast.error('Failed to generate coin keys');
    } else {
      toast.success(`Generated ${keyCount} coin keys successfully`);
      fetchCoinKeys();
    }
    
    setLoading(false);
  };

  const deleteCoinKey = async (keyId: string) => {
    const { error } = await supabase
      .from('coin_keys')
      .delete()
      .eq('id', keyId);
    
    if (error) {
      toast.error('Failed to delete coin key');
    } else {
      toast.success('Coin key deleted successfully');
      fetchCoinKeys();
    }
  };

  const updateUserBalance = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('user_balances')
      .update({ balance: balanceAmount })
      .eq('id', selectedUserId);

    if (error) {
      toast.error('Failed to update user balance');
    } else {
      toast.success('User balance updated successfully');
      fetchUserProfiles();
    }
    setLoading(false);
  };

  const resetUserStats = async (userId: string) => {
    const { error } = await supabase
      .from('user_stats')
      .update({
        total_bets: 0,
        total_won: 0,
        total_lost: 0,
        biggest_win: 0,
        current_win_streak: 0,
        current_loss_streak: 0,
        longest_win_streak: 0,
        longest_loss_streak: 0
      })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to reset user stats');
    } else {
      toast.success('User stats reset successfully');
      fetchUserProfiles();
    }
  };

  const deleteAllKeys = async () => {
    const { error } = await supabase
      .from('coin_keys')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast.error('Failed to delete all keys');
    } else {
      toast.success('All coin keys deleted successfully');
      fetchCoinKeys();
    }
  };

  const giveUserMaxCoins = async (userId: string) => {
    const { error } = await supabase
      .from('user_balances')
      .update({ balance: 999999999 })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to give max coins');
    } else {
      toast.success('User given max coins!');
      fetchUserProfiles();
    }
  };

  const deleteUserGameHistory = async (userId: string) => {
    const { error } = await supabase
      .from('game_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to delete game history');
    } else {
      toast.success('User game history deleted');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-bold text-red-400 font-mono">Admin Panel</h1>
          </div>
          <p className="text-gray-300 font-mono">Manage users, keys, and system settings</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-gray-800">
            <TabsTrigger value="users" className="font-mono">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="keys" className="font-mono">
              <Key className="w-4 h-4 mr-2" />
              Coin Keys
            </TabsTrigger>
            <TabsTrigger value="tools" className="font-mono">
              <Settings className="w-4 h-4 mr-2" />
              Admin Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400 font-mono">User Profiles</CardTitle>
                <CardDescription>Manage user accounts and balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfiles.map((user) => (
                    <div key={user.id} className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-mono font-bold text-lg">{user.username}</div>
                          <div className="text-sm text-gray-400">
                            Balance: {user.balance} • Bets: {user.total_bets} • Best Win: {user.biggest_win}
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => giveUserMaxCoins(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                            size="sm"
                          >
                            <Coins className="w-3 h-3 mr-1" />
                            MAX COINS
                          </Button>
                          <Button
                            onClick={() => resetUserStats(user.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                            size="sm"
                          >
                            <Database className="w-3 h-3 mr-1" />
                            RESET STATS
                          </Button>
                          <Button
                            onClick={() => deleteUserGameHistory(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-xs"
                            size="sm"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            DELETE HISTORY
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 font-mono">Generate Coin Keys</CardTitle>
                <CardDescription>Create redeemable coin keys for users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-mono mb-2">Key Amount</label>
                    <Input
                      type="number"
                      value={keyAmount}
                      onChange={(e) => setKeyAmount(Number(e.target.value))}
                      className="bg-gray-700 border-gray-600 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono mb-2">Number of Keys</label>
                    <Input
                      type="number"
                      value={keyCount}
                      onChange={(e) => setKeyCount(Number(e.target.value))}
                      className="bg-gray-700 border-gray-600 text-white font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={generateCoinKeys}
                      disabled={loading}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      {loading ? 'Generating...' : 'Generate Keys'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-green-400 font-mono">Coin Keys</CardTitle>
                    <CardDescription>Manage existing coin keys</CardDescription>
                  </div>
                  <Button
                    onClick={deleteAllKeys}
                    className="bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Keys
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {coinKeys.map((key) => (
                    <div
                      key={key.id}
                      className={`p-3 rounded-lg border flex justify-between items-center ${
                        key.used ? 'bg-red-900/20 border-red-600' : 'bg-green-900/20 border-green-600'
                      }`}
                    >
                      <div className="font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{key.code}</span>
                          <span className="text-sm px-2 py-1 bg-yellow-600 text-black rounded">
                            {key.amount} coins
                          </span>
                          {key.used && (
                            <span className="text-sm px-2 py-1 bg-red-600 text-white rounded">
                              USED
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                          {key.used_at && ` • Used: ${new Date(key.used_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteCoinKey(key.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 font-mono">Super Admin Tools</CardTitle>
                <CardDescription>Advanced administration features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-750 rounded-lg">
                    <h4 className="font-mono text-yellow-400 mb-2 flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Balance Management
                    </h4>
                    <div className="space-y-2">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                      >
                        <option value="">Select User</option>
                        {userProfiles.map(user => (
                          <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(Number(e.target.value))}
                        placeholder="New balance amount"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button
                        onClick={updateUserBalance}
                        disabled={loading || !selectedUserId}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Update Balance
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-750 rounded-lg">
                    <h4 className="font-mono text-red-400 mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      System Statistics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="text-green-400">{userProfiles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Keys:</span>
                        <span className="text-yellow-400">{coinKeys.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used Keys:</span>
                        <span className="text-red-400">{coinKeys.filter(k => k.used).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Coins:</span>
                        <span className="text-blue-400">
                          {userProfiles.reduce((sum, user) => sum + user.balance, 0).toLocaleString()}
                        </span>
                      </div>
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

export default AdminPanel;
