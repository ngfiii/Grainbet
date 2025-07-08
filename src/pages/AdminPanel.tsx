
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, Eye, DollarSign, Users, GamepadIcon, Settings } from 'lucide-react';

interface User {
  id: string;
  username: string;
  balance: number;
  email?: string;
}

interface GameHistoryEntry {
  id: string;
  user_id: string;
  username?: string;
  game_type: string;
  bet_amount: number;
  payout: number;
  is_win: boolean;
  created_at: string;
}

interface CoinKey {
  id: string;
  code: string;
  amount: number;
  used: boolean;
  used_by: string | null;
  created_at: string;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [coinKeys, setCoinKeys] = useState<CoinKey[]>([]);
  const [loading, setLoading] = useState(false);

  // Coin key generation states
  const [keyAmount, setKeyAmount] = useState(100);
  const [keyCount, setKeyCount] = useState(1);

  // Temp password states
  const [tempPassword, setTempPassword] = useState('');
  const [tempPasswordHours, setTempPasswordHours] = useState(24);

  // User balance modification
  const [selectedUserId, setSelectedUserId] = useState('');
  const [balanceChange, setBalanceChange] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchGameHistory();
    fetchCoinKeys();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username');

      const { data: balances } = await supabase
        .from('user_balances')
        .select('id, balance');

      if (profiles && balances) {
        const usersData = profiles.map(profile => ({
          id: profile.id,
          username: profile.username || 'Unknown',
          balance: balances.find(b => b.id === profile.id)?.balance || 0
        }));
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchGameHistory = async () => {
    try {
      const { data } = await supabase
        .from('game_history')
        .select(`
          id,
          user_id,
          game_type,
          bet_amount,
          payout,
          is_win,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const historyWithUsernames = await Promise.all(
          data.map(async (entry) => {
            const user = users.find(u => u.id === entry.user_id);
            return {
              ...entry,
              username: user?.username || 'Unknown User'
            };
          })
        );
        setGameHistory(historyWithUsernames);
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
      toast.error('Failed to fetch game history');
    }
  };

  const fetchCoinKeys = async () => {
    try {
      const { data } = await supabase
        .from('coin_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setCoinKeys(data);
      }
    } catch (error) {
      console.error('Error fetching coin keys:', error);
      toast.error('Failed to fetch coin keys');
    }
  };

  const generateCoinKeys = async () => {
    setLoading(true);
    try {
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

      if (error) throw error;

      toast.success(`Generated ${keyCount} coin keys successfully!`);
      fetchCoinKeys();
    } catch (error) {
      console.error('Error generating coin keys:', error);
      toast.error('Failed to generate coin keys');
    } finally {
      setLoading(false);
    }
  };

  const deleteCoinKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('coin_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast.success('Coin key deleted successfully!');
      fetchCoinKeys();
    } catch (error) {
      console.error('Error deleting coin key:', error);
      toast.error('Failed to delete coin key');
    }
  };

  const generateTempPassword = async () => {
    if (!tempPassword.trim()) {
      toast.error('Please enter a temporary password');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + tempPasswordHours);

      const { error } = await supabase
        .from('temp_passwords')
        .insert({
          password: tempPassword,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      toast.success(`Temporary password created! Expires in ${tempPasswordHours} hours.`);
      setTempPassword('');
    } catch (error) {
      console.error('Error creating temp password:', error);
      toast.error('Failed to create temporary password');
    }
  };

  const modifyUserBalance = async () => {
    if (!selectedUserId || balanceChange === 0) {
      toast.error('Please select a user and enter a balance change amount');
      return;
    }

    try {
      const { data: currentBalance } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', selectedUserId)
        .single();

      if (!currentBalance) {
        toast.error('User balance not found');
        return;
      }

      const newBalance = Math.max(0, currentBalance.balance + balanceChange);

      const { error } = await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('id', selectedUserId);

      if (error) throw error;

      toast.success(`Balance ${balanceChange > 0 ? 'increased' : 'decreased'} successfully!`);
      fetchUsers();
      setBalanceChange(0);
    } catch (error) {
      console.error('Error modifying balance:', error);
      toast.error('Failed to modify user balance');
    }
  };

  const deleteAllGameHistory = async () => {
    if (!confirm('Are you sure you want to delete ALL game history? This cannot be undone!')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('game_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) throw error;

      toast.success('All game history deleted successfully!');
      setGameHistory([]);
    } catch (error) {
      console.error('Error deleting game history:', error);
      toast.error('Failed to delete game history');
    }
  };

  const resetAllUserBalances = async () => {
    if (!confirm('Are you sure you want to reset ALL user balances to 1000? This cannot be undone!')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_balances')
        .update({ balance: 1000 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

      if (error) throw error;

      toast.success('All user balances reset to 1000!');
      fetchUsers();
    } catch (error) {
      console.error('Error resetting balances:', error);
      toast.error('Failed to reset user balances');
    }
  };

  const giveAllUsersCoins = async () => {
    const amount = prompt('Enter amount of coins to give to ALL users:');
    if (!amount || isNaN(Number(amount))) return;

    const coinAmount = Number(amount);
    
    if (!confirm(`Give ${coinAmount} coins to ALL ${users.length} users?`)) {
      return;
    }

    try {
      for (const user of users) {
        await supabase
          .from('user_balances')
          .update({ balance: user.balance + coinAmount })
          .eq('id', user.id);
      }

      toast.success(`Gave ${coinAmount} coins to all users!`);
      fetchUsers();
    } catch (error) {
      console.error('Error giving coins to all users:', error);
      toast.error('Failed to give coins to all users');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img alt="GrainBet Logo" className="w-8 h-8" src="/lovable-uploads/b02b29fd-4df8-4fd3-83d6-52e449f3c4ab.png" />
            <h1 className="text-3xl font-bold text-red-400 font-mono">Admin Panel</h1>
            <Settings className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-300 font-mono">Administrative control center</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-red-600">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-red-600">
              <GamepadIcon className="w-4 h-4 mr-2" />
              Game History
            </TabsTrigger>
            <TabsTrigger value="keys" className="data-[state=active]:bg-red-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Coin Keys
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-red-600">
              <Settings className="w-4 h-4 mr-2" />
              Admin Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage user accounts and balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* User Balance Modification */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-700 rounded-lg">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="bg-gray-600 border-gray-500 text-white rounded px-3 py-2"
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} (Balance: {user.balance})
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Balance change (+/-)"
                      value={balanceChange}
                      onChange={(e) => setBalanceChange(Number(e.target.value))}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                    <Button onClick={modifyUserBalance} className="bg-blue-600 hover:bg-blue-700">
                      Modify Balance
                    </Button>
                    <Button onClick={fetchUsers} variant="outline">
                      Refresh Users
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid gap-2">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-mono font-bold">{user.username}</div>
                            <div className="text-sm text-gray-400 font-mono">{user.id}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400 font-mono">
                              {user.balance} coins
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <GamepadIcon className="w-5 h-5" />
                  Game History
                </CardTitle>
                <CardDescription>View all game activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={fetchGameHistory} variant="outline">
                      Refresh History
                    </Button>
                    <Button 
                      onClick={deleteAllGameHistory} 
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All History
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {gameHistory.map(entry => (
                        <div key={entry.id} className="p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono font-bold">
                                {entry.username} - {entry.game_type.toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(entry.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono">
                                Bet: {entry.bet_amount} | Payout: {entry.payout}
                              </div>
                              <div className={`text-sm font-bold ${entry.is_win ? 'text-green-400' : 'text-red-400'}`}>
                                {entry.is_win ? 'WIN' : 'LOSS'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <DollarSign className="w-5 h-5" />
                  Coin Key Management
                </CardTitle>
                <CardDescription>Generate and manage coin redemption keys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-700 rounded-lg">
                    <Input
                      type="number"
                      placeholder="Key amount"
                      value={keyAmount}
                      onChange={(e) => setKeyAmount(Number(e.target.value))}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Number of keys"
                      value={keyCount}
                      onChange={(e) => setKeyCount(Number(e.target.value))}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                    <Button onClick={generateCoinKeys} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Keys
                    </Button>
                    <Button onClick={fetchCoinKeys} variant="outline">
                      Refresh Keys
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {coinKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-mono font-bold text-yellow-400">{key.code}</div>
                            <div className="text-sm text-gray-400">
                              {key.amount} coins - {key.used ? 'USED' : 'AVAILABLE'}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <Settings className="w-5 h-5" />
                  Admin Tools - DANGER ZONE
                </CardTitle>
                <CardDescription>Powerful administrative tools - use with caution!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Temporary Password Generation */}
                  <div className="p-4 bg-gray-700 rounded-lg border border-yellow-600">
                    <h3 className="text-lg font-bold text-yellow-400 mb-4">Temporary Admin Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        type="text"
                        placeholder="Temporary password"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="Valid for (hours)"
                        value={tempPasswordHours}
                        onChange={(e) => setTempPasswordHours(Number(e.target.value))}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                      <Button onClick={generateTempPassword} className="bg-yellow-600 hover:bg-yellow-700">
                        Create Temp Password
                      </Button>
                    </div>
                  </div>

                  {/* Mass User Operations */}
                  <div className="p-4 bg-gray-700 rounded-lg border border-red-600">
                    <h3 className="text-lg font-bold text-red-400 mb-4">Mass User Operations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        onClick={giveAllUsersCoins} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        💰 Give All Users Coins
                      </Button>
                      <Button 
                        onClick={resetAllUserBalances} 
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        🔄 Reset All Balances
                      </Button>
                      <Button 
                        onClick={deleteAllGameHistory} 
                        className="bg-red-600 hover:bg-red-700"
                      >
                        🗑️ Wipe Game History
                      </Button>
                    </div>
                  </div>

                  {/* Server Statistics */}
                  <div className="p-4 bg-gray-700 rounded-lg border border-blue-600">
                    <h3 className="text-lg font-bold text-blue-400 mb-4">Server Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-gray-600 rounded">
                        <div className="text-2xl font-bold text-blue-400">{users.length}</div>
                        <div className="text-sm text-gray-300">Total Users</div>
                      </div>
                      <div className="p-3 bg-gray-600 rounded">
                        <div className="text-2xl font-bold text-green-400">{gameHistory.length}</div>
                        <div className="text-sm text-gray-300">Game Records</div>
                      </div>
                      <div className="p-3 bg-gray-600 rounded">
                        <div className="text-2xl font-bold text-yellow-400">{coinKeys.length}</div>
                        <div className="text-sm text-gray-300">Coin Keys</div>
                      </div>
                      <div className="p-3 bg-gray-600 rounded">
                        <div className="text-2xl font-bold text-purple-400">
                          {users.reduce((sum, user) => sum + user.balance, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-300">Total Coins</div>
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
