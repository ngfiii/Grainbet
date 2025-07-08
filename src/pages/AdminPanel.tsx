import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Download, Key, Clock, Settings, Users, UserPlus, DollarSign, BarChart3, Shield, Database } from 'lucide-react';

interface CoinKey {
  id: string;
  code: string;
  amount: number;
  used: boolean;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
}

interface TempPassword {
  id: string;
  password: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  balance: number;
  total_bets: number;
  biggest_win: number;
  created_at: string;
}

const AdminPanel = () => {
  const [coinKeys, setCoinKeys] = useState<CoinKey[]>([]);
  const [tempPasswords, setTempPasswords] = useState<TempPassword[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [newKeyAmount, setNewKeyAmount] = useState(100);
  const [newKeyQuantity, setNewKeyQuantity] = useState(1);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [tempPasswordDuration, setTempPasswordDuration] = useState(24);
  const [deleteKeyAmount, setDeleteKeyAmount] = useState(100);
  const [deleteKeyQuantity, setDeleteKeyQuantity] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserBalance, setNewUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const fetchTempPasswords = async () => {
    const { data, error } = await supabase
      .from('temp_passwords')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch temporary passwords');
      return;
    }
    setTempPasswords(data || []);
  };

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

  useEffect(() => {
    fetchCoinKeys();
    fetchTempPasswords();
    fetchUserProfiles();
  }, []);

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createCoinKeys = async () => {
    setLoading(true);
    const keysToCreate = [];
    
    for (let i = 0; i < newKeyQuantity; i++) {
      keysToCreate.push({
        code: generateRandomString(12),
        amount: newKeyAmount
      });
    }

    const { error } = await supabase
      .from('coin_keys')
      .insert(keysToCreate);

    if (error) {
      toast.error('Failed to create coin keys');
    } else {
      toast.success(`Created ${newKeyQuantity} coin key${newKeyQuantity > 1 ? 's' : ''}`);
      fetchCoinKeys();
    }
    setLoading(false);
  };

  const createTempPassword = async () => {
    if (!newTempPassword.trim()) {
      toast.error('Please enter a temporary password');
      return;
    }

    setLoading(true);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + tempPasswordDuration);

    const { error } = await supabase
      .from('temp_passwords')
      .insert({
        password: newTempPassword,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      toast.error('Failed to create temporary password');
    } else {
      toast.success('Temporary password created successfully');
      setNewTempPassword('');
      fetchTempPasswords();
    }
    setLoading(false);
  };

  const deleteCoinKey = async (id: string) => {
    const { error } = await supabase
      .from('coin_keys')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete coin key');
    } else {
      toast.success('Coin key deleted');
      fetchCoinKeys();
    }
  };

  const deleteKeysByAmountAndQuantity = async () => {
    if (!deleteKeyAmount || !deleteKeyQuantity) {
      toast.error('Please enter valid amount and quantity');
      return;
    }

    const { data: keysToDelete } = await supabase
      .from('coin_keys')
      .select('id')
      .eq('amount', deleteKeyAmount)
      .eq('used', false)
      .limit(deleteKeyQuantity);

    if (!keysToDelete || keysToDelete.length === 0) {
      toast.error(`No unused ${deleteKeyAmount} coin keys found`);
      return;
    }

    const idsToDelete = keysToDelete.map(key => key.id);
    const { error } = await supabase
      .from('coin_keys')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      toast.error('Failed to delete keys');
    } else {
      toast.success(`Deleted ${keysToDelete.length} keys of ${deleteKeyAmount} coins`);
      fetchCoinKeys();
    }
  };

  const updateUserBalance = async () => {
    if (!selectedUserId || newUserBalance < 0) {
      toast.error('Please select a user and enter a valid balance');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('user_balances')
      .update({ balance: newUserBalance })
      .eq('id', selectedUserId);

    if (error) {
      toast.error('Failed to update user balance');
    } else {
      toast.success('User balance updated successfully');
      fetchUserProfiles();
      setNewUserBalance(0);
      setSelectedUserId('');
    }
    setLoading(false);
  };

  const exportKeysToTxt = (keyType: 'active' | 'used' | 'all') => {
    let keysToExport: CoinKey[] = [];
    
    switch (keyType) {
      case 'active':
        keysToExport = coinKeys.filter(key => !key.used);
        break;
      case 'used':
        keysToExport = coinKeys.filter(key => key.used);
        break;
      case 'all':
        keysToExport = coinKeys;
        break;
    }

    const keysList = keysToExport.map(key => `${key.code} - ${key.amount} coins`).join('\n');
    const blob = new Blob([keysList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grainbet-${keyType}-keys-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${keyType} keys exported to TXT file`);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const uniqueAmounts = [...new Set(coinKeys.map(key => key.amount))].sort((a, b) => a - b);
  const totalUsers = userProfiles.length;
  const totalCoinsInKeys = coinKeys.reduce((sum, k) => sum + (k.used ? 0 : k.amount), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 md:space-x-3 mb-4">
            <img alt="GrainBet Logo" className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" src="/lovable-uploads/b02b29fd-4df8-4fd3-83d6-52e449f3c4ab.png" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-400 font-mono">Admin Panel</h1>
          </div>
          <p className="text-gray-300 font-mono text-xs md:text-sm lg:text-base">Manage coin keys and system administration</p>
        </div>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-gray-800 text-xs md:text-sm">
            <TabsTrigger value="keys" className="font-mono text-xs md:text-sm">
              <Key className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Key Management
            </TabsTrigger>
            <TabsTrigger value="temp" className="font-mono text-xs md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Temp Passwords
            </TabsTrigger>
            <TabsTrigger value="users" className="font-mono text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="tools" className="font-mono text-xs md:text-sm">
              <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Admin Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 font-mono flex items-center gap-2 text-sm md:text-base">
                  <Key className="w-4 h-4 md:w-5 md:h-5" />
                  Coin Keys Management
                </CardTitle>
                <CardDescription className="text-gray-300 text-xs md:text-sm">
                  Create and manage coin redemption keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create Keys Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-mono mb-2">Amount per key</label>
                    <Input
                      type="number"
                      value={newKeyAmount}
                      onChange={(e) => setNewKeyAmount(parseInt(e.target.value) || 100)}
                      className="bg-gray-700 border-gray-600 text-white font-mono text-xs md:text-sm"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-mono mb-2">Quantity</label>
                    <Input
                      type="number"
                      value={newKeyQuantity}
                      onChange={(e) => setNewKeyQuantity(parseInt(e.target.value) || 1)}
                      className="bg-gray-700 border-gray-600 text-white font-mono text-xs md:text-sm"
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <Button
                  onClick={createCoinKeys}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 font-mono text-xs md:text-sm"
                >
                  Create Keys
                </Button>

                {/* Export Keys */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => exportKeysToTxt('active')} variant="outline" className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black font-mono text-xs md:text-sm flex-1">
                    <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Export Active
                  </Button>
                  <Button onClick={() => exportKeysToTxt('used')} variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white font-mono text-xs md:text-sm flex-1">
                    <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Export Used
                  </Button>
                  <Button onClick={() => exportKeysToTxt('all')} variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white font-mono text-xs md:text-sm flex-1">
                    <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Export All
                  </Button>
                </div>

                {/* Custom Delete Keys */}
                <div className="bg-gray-750 p-3 md:p-4 rounded-lg border border-gray-600">
                  <h4 className="text-sm md:text-base font-mono text-red-400 mb-3">Custom Key Deletion</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-mono mb-2">Coin Amount</label>
                      <Input
                        type="number"
                        value={deleteKeyAmount}
                        onChange={(e) => setDeleteKeyAmount(parseInt(e.target.value) || 100)}
                        className="bg-gray-700 border-gray-600 text-white font-mono text-xs"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono mb-2">Number of Keys</label>
                      <Input
                        type="number"
                        value={deleteKeyQuantity}
                        onChange={(e) => setDeleteKeyQuantity(parseInt(e.target.value) || 1)}
                        className="bg-gray-700 border-gray-600 text-white font-mono text-xs"
                        min={1}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={deleteKeysByAmountAndQuantity}
                    variant="destructive"
                    className="w-full font-mono text-xs"
                  >
                    Delete {deleteKeyQuantity} keys of {deleteKeyAmount} coins
                  </Button>
                </div>

                {/* Keys List */}
                <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-2">
                  {coinKeys.map((key) => (
                    <div
                      key={key.id}
                      className={`p-2 md:p-3 rounded border text-xs md:text-sm ${
                        key.used ? 'bg-gray-700 border-gray-600 opacity-60' : 'bg-gray-750 border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-mono flex-1 min-w-0">
                          <div className="truncate text-xs md:text-sm">{key.code}</div>
                          <div className="text-yellow-400 text-xs md:text-sm">{key.amount} coins</div>
                          <div className="text-xs text-gray-400">
                            {key.used ? `Used ${new Date(key.used_at!).toLocaleDateString()}` : 'Available'}
                          </div>
                        </div>
                        {!key.used && (
                          <Button
                            onClick={() => deleteCoinKey(key.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temp" className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400 font-mono flex items-center gap-2 text-sm md:text-base">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  Temporary Access Keys
                </CardTitle>
                <CardDescription className="text-gray-300 text-xs md:text-sm">
                  Create temporary admin access passwords
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-mono mb-2">New temporary password</label>
                  <Input
                    type="text"
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    placeholder="Enter temporary password"
                    className="bg-gray-700 border-gray-600 text-white font-mono text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-mono mb-2">Duration (hours)</label>
                  <Input
                    type="number"
                    value={tempPasswordDuration}
                    onChange={(e) => setTempPasswordDuration(parseInt(e.target.value) || 24)}
                    className="bg-gray-700 border-gray-600 text-white font-mono text-xs md:text-sm"
                    min={1}
                    max={168}
                  />
                </div>

                <Button
                  onClick={createTempPassword}
                  disabled={loading || !newTempPassword.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-mono text-xs md:text-sm"
                >
                  Create Temporary Key
                </Button>

                <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-2">
                  {tempPasswords.map((temp) => (
                    <div
                      key={temp.id}
                      className={`p-2 md:p-3 rounded border text-xs md:text-sm ${
                        temp.used || isExpired(temp.expires_at)
                          ? 'bg-gray-700 border-gray-600 opacity-60'
                          : 'bg-gray-750 border-gray-600'
                      }`}
                    >
                      <div className="font-mono">
                        <div className="truncate font-medium text-xs md:text-sm">{temp.password}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Expires: {new Date(temp.expires_at).toLocaleString()}
                        </div>
                        <div className="text-xs">
                          Status: {temp.used ? (
                            <span className="text-red-400">Used</span>
                          ) : isExpired(temp.expires_at) ? (
                            <span className="text-orange-400">Expired</span>
                          ) : (
                            <span className="text-green-400">Active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 font-mono flex items-center gap-2 text-sm md:text-base">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  User Management
                </CardTitle>
                <CardDescription className="text-gray-300 text-xs md:text-sm">
                  Manage user accounts and balances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-750 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 font-mono">{totalUsers}</div>
                    <div className="text-xs text-gray-400">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 font-mono">
                      {userProfiles.filter(u => new Date(u.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
                    </div>
                    <div className="text-xs text-gray-400">New (24h)</div>
                  </div>
                </div>

                {/* Balance Editor */}
                <div className="space-y-3">
                  <h4 className="text-sm font-mono text-yellow-400">Edit User Balance</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono mb-2">Select User</label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choose user..." />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {userProfiles.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="text-white">
                              {user.username} (Balance: {user.balance})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono mb-2">New Balance</label>
                      <Input
                        type="number"
                        value={newUserBalance}
                        onChange={(e) => setNewUserBalance(parseFloat(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-600 text-white font-mono text-xs"
                        min={0}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={updateUserBalance}
                    disabled={loading || !selectedUserId}
                    className="w-full bg-purple-600 hover:bg-purple-700 font-mono text-xs"
                  >
                    Update Balance
                  </Button>
                </div>

                {/* Users List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {userProfiles.map((user) => (
                    <div key={user.id} className="p-3 bg-gray-750 rounded border border-gray-600 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="font-mono">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-gray-400">Balance: {user.balance} coins</div>
                          <div className="text-gray-400">Bets: {user.total_bets} | Biggest Win: {user.biggest_win}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono flex items-center gap-2 text-sm md:text-base">
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                  Admin Tools
                </CardTitle>
                <CardDescription className="text-gray-300 text-xs md:text-sm">
                  Administrative tools and system utilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* System Analytics */}
                  <div className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <h4 className="font-mono text-blue-400 text-sm">System Analytics</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="text-green-400">{totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Keys:</span>
                        <span className="text-yellow-400">{coinKeys.filter(k => !k.used).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coins in Keys:</span>
                        <span className="text-purple-400">{totalCoinsInKeys}</span>
                      </div>
                    </div>
                  </div>

                  {/* Database Tools */}
                  <div className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-green-400" />
                      <h4 className="font-mono text-green-400 text-sm">Database Tools</h4>
                    </div>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Export User Data
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Backup Database
                      </Button>
                    </div>
                  </div>

                  {/* Security Tools */}
                  <div className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-red-400" />
                      <h4 className="font-mono text-red-400 text-sm">Security</h4>
                    </div>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        View Login Logs
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Suspicious Activity
                      </Button>
                    </div>
                  </div>

                  {/* Financial Tools */}
                  <div className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      <h4 className="font-mono text-yellow-400 text-sm">Financial</h4>
                    </div>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Transaction History
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Balance Reports
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <h4 className="font-mono text-orange-400 text-sm mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      Clear Temp Keys
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Reset Stats
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Maintenance Mode
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      System Health
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Statistics */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-purple-400 font-mono text-sm md:text-base">System Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
              <div>
                <div className="text-lg md:text-2xl font-bold text-green-400 font-mono">
                  {coinKeys.filter(k => !k.used).length}
                </div>
                <div className="text-xs md:text-sm text-gray-400">Available Keys</div>
              </div>
              <div>
                <div className="text-lg md:text-2xl font-bold text-red-400 font-mono">
                  {coinKeys.filter(k => k.used).length}
                </div>
                <div className="text-xs md:text-sm text-gray-400">Used Keys</div>
              </div>
              <div>
                <div className="text-lg md:text-2xl font-bold text-blue-400 font-mono">
                  {tempPasswords.filter(t => !t.used && !isExpired(t.expires_at)).length}
                </div>
                <div className="text-xs md:text-sm text-gray-400">Active Temp Keys</div>
              </div>
              <div>
                <div className="text-lg md:text-2xl font-bold text-yellow-400 font-mono">
                  {totalCoinsInKeys}
                </div>
                <div className="text-xs md:text-sm text-gray-400">Total Coins Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
