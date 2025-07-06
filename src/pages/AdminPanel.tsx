import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CoinKey {
  id: string;
  code: string;
  amount: number;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

interface UserBalance {
  id: string;
  balance: number;
  username?: string;
}

interface TempPassword {
  id: string;
  password: string;
  expires_at: string;
  created_at: string;
  used: boolean;
}

interface KeyStats {
  [amount: number]: {
    used: number;
    unused: number;
    total: number;
  };
}

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tempPassword, setTempPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keys, setKeys] = useState<CoinKey[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [tempPasswords, setTempPasswords] = useState<TempPassword[]>([]);
  const [keyStats, setKeyStats] = useState<KeyStats>({});
  const [loading, setLoading] = useState(false);

  // Generate Keys
  const [keyAmount, setKeyAmount] = useState(100);
  const [keyCount, setKeyCount] = useState(1);

  // User Balance Management
  const [selectedUserId, setSelectedUserId] = useState('');
  const [balanceAmount, setBalanceAmount] = useState(0);

  // Temp Password Generation
  const [tempPasswordExpiry, setTempPasswordExpiry] = useState(24);

  // Delete specific keys
  const [deleteAmount, setDeleteAmount] = useState(100);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      loadData();
    }
  }, [user]);

  // Check if temporary password is valid and not expired
  const checkTempPassword = async (password: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('temp_passwords')
        .select('*')
        .eq('password', password)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && data;
    } catch {
      return false;
    }
  };

  const handleTempPasswordSubmit = async () => {
    const isValid = await checkTempPassword(tempPassword);
    if (isValid) {
      setIsAuthenticated(true);
      loadData();
      toast.success('Access granted with temporary password');
    } else {
      toast.error('Invalid or expired temporary password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadKeys(),
      loadUserBalances(),
      loadTempPasswords()
    ]);
    setLoading(false);
  };

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('coin_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
      
      // Calculate stats
      const stats: KeyStats = {};
      (data || []).forEach(key => {
        if (!stats[key.amount]) {
          stats[key.amount] = { used: 0, unused: 0, total: 0 };
        }
        stats[key.amount].total++;
        if (key.used) {
          stats[key.amount].used++;
        } else {
          stats[key.amount].unused++;
        }
      });
      setKeyStats(stats);
    } catch (error) {
      console.error('Error loading keys:', error);
      toast.error('Failed to load keys');
    }
  };

  const loadUserBalances = async () => {
    try {
      // Use a simpler query without joins for now
      const { data: balances, error: balancesError } = await supabase
        .from('user_balances')
        .select('*');

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (balancesError) throw balancesError;
      if (profilesError) throw profilesError;

      const formattedData = (balances || []).map(balance => {
        const profile = (profiles || []).find(p => p.id === balance.id);
        return {
          id: balance.id,
          balance: balance.balance,
          username: profile?.username || 'Unknown'
        };
      });
      
      setUserBalances(formattedData);
    } catch (error) {
      console.error('Error loading user balances:', error);
      toast.error('Failed to load user balances');
    }
  };

  const loadTempPasswords = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('temp_passwords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTempPasswords(data || []);
    } catch (error) {
      console.error('Error loading temp passwords:', error);
    }
  };

  const generateKeys = async () => {
    if (keyCount < 1 || keyCount > 1000) {
      toast.error('Key count must be between 1 and 1000');
      return;
    }
    
    try {
      setLoading(true);
      const keysToInsert = [];
      
      for (let i = 0; i < keyCount; i++) {
        const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        keysToInsert.push({
          code,
          amount: keyAmount,
          used: false
        });
      }

      const { error } = await supabase
        .from('coin_keys')
        .insert(keysToInsert);

      if (error) throw error;
      
      toast.success(`Generated ${keyCount} keys of ${keyAmount} coins each`);
      await loadKeys();
    } catch (error) {
      console.error('Error generating keys:', error);
      toast.error('Failed to generate keys');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllKeys = async (type: 'all' | 'used' | 'unused') => {
    try {
      setLoading(true);
      let query = supabase.from('coin_keys').delete();
      
      if (type === 'used') {
        query = query.eq('used', true);
      } else if (type === 'unused') {
        query = query.eq('used', false);
      }
      // For 'all', no additional filter needed

      const { error } = await query;
      if (error) throw error;
      
      toast.success(`Deleted all ${type} keys`);
      await loadKeys();
    } catch (error) {
      console.error('Error deleting keys:', error);
      toast.error('Failed to delete keys');
    } finally {
      setLoading(false);
    }
  };

  const deleteSpecificAmountKeys = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('coin_keys')
        .delete()
        .eq('amount', deleteAmount);

      if (error) throw error;
      
      toast.success(`Deleted all keys worth ${deleteAmount} coins`);
      await loadKeys();
    } catch (error) {
      console.error('Error deleting specific amount keys:', error);
      toast.error('Failed to delete keys');
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          balance: balanceAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserId);

      if (error) throw error;
      
      toast.success('User balance updated successfully');
      await loadUserBalances();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update user balance');
    } finally {
      setLoading(false);
    }
  };

  const generateTempPassword = async () => {
    try {
      setLoading(true);
      const password = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + tempPasswordExpiry);

      const { error } = await (supabase as any)
        .from('temp_passwords')
        .insert({
          password,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (error) throw error;
      
      toast.success(`Generated temporary password: ${password}`);
      await loadTempPasswords();
    } catch (error) {
      console.error('Error generating temp password:', error);
      toast.error('Failed to generate temporary password');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Nuclear Options
  const resetAllUserBalances = async () => {
    if (!confirm('Are you sure you want to reset ALL user balances to 500? This cannot be undone!')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_balances')
        .update({ balance: 500, updated_at: new Date().toISOString() });

      if (error) throw error;
      
      toast.success('All user balances reset to 500');
      await loadUserBalances();
    } catch (error) {
      console.error('Error resetting balances:', error);
      toast.error('Failed to reset balances');
    } finally {
      setLoading(false);
    }
  };

  const giveAllUsersCoins = async () => {
    const amount = prompt('How many coins to give all users?');
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      setLoading(true);
      
      // Get all users
      const { data: users, error: fetchError } = await supabase
        .from('user_balances')
        .select('id, balance');

      if (fetchError) throw fetchError;

      // Update each user's balance
      const updates = users.map(user => ({
        id: user.id,
        balance: user.balance + Number(amount),
        updated_at: new Date().toISOString()
      }));

      const { error: updateError } = await supabase
        .from('user_balances')
        .upsert(updates);

      if (updateError) throw updateError;
      
      toast.success(`Gave ${amount} coins to all ${users.length} users`);
      await loadUserBalances();
    } catch (error) {
      console.error('Error giving coins to all users:', error);
      toast.error('Failed to give coins to all users');
    } finally {
      setLoading(false);
    }
  };

  if (!user && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-yellow-400">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tempPassword">Temporary Password</Label>
              <Input
                id="tempPassword"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter temporary password"
              />
            </div>
            <Button
              onClick={handleTempPasswordSubmit}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
            >
              Access Admin Panel
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">🔧 Admin Panel</h1>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Back to Site
          </Button>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-gray-800">
            <TabsTrigger value="keys" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black">
              Key Management
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black">
              User Management
            </TabsTrigger>
            <TabsTrigger value="temp" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black">
              Temp Passwords
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black">
              Statistics
            </TabsTrigger>
            <TabsTrigger value="nuclear" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Nuclear Options
            </TabsTrigger>
          </TabsList>

          {/* Key Management */}
          <TabsContent value="keys" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Generate Keys */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Generate Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Amount per Key</Label>
                    <Input
                      type="number"
                      value={keyAmount}
                      onChange={(e) => setKeyAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label>Number of Keys (Max: 1000)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={keyCount}
                      onChange={(e) => setKeyCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button
                    onClick={generateKeys}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Generate Keys
                  </Button>
                </CardContent>
              </Card>

              {/* Bulk Delete */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-red-400">Bulk Delete Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => deleteAllKeys('unused')}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete All Unused Keys
                  </Button>
                  <Button
                    onClick={() => deleteAllKeys('used')}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete All Used Keys
                  </Button>
                  <Button
                    onClick={() => deleteAllKeys('all')}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete ALL Keys
                  </Button>
                </CardContent>
              </Card>

              {/* Delete Specific Amount */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-orange-400">Delete by Amount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Coin Amount</Label>
                    <Input
                      type="number"
                      value={deleteAmount}
                      onChange={(e) => setDeleteAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button
                    onClick={deleteSpecificAmountKeys}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete All {deleteAmount} Coin Keys
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Key Stats Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">Key Statistics by Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(keyStats)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([amount, stats]) => (
                    <div key={amount} className="bg-gray-700 p-4 rounded-lg text-center">
                      <div className="text-lg font-bold text-yellow-400">{amount} coins</div>
                      <div className="text-sm text-gray-300">
                        <div className="text-green-400">✓ {stats.used} used</div>
                        <div className="text-blue-400">⚪ {stats.unused} unused</div>
                        <div className="text-gray-400">Total: {stats.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Keys */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">Recent Keys (Last 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {keys.slice(0, 50).map((key) => (
                    <div key={key.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div>
                        <code className="text-green-400">{key.code}</code>
                        <Badge className="ml-2 bg-yellow-600 text-black">{key.amount} coins</Badge>
                      </div>
                      <div className="text-right">
                        <Badge variant={key.used ? "destructive" : "secondary"}>
                          {key.used ? 'Used' : 'Available'}
                        </Badge>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(key.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">User Balance Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Select User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Choose user" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {userBalances.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username} (Current: {user.balance} coins)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>New Balance</Label>
                    <Input
                      type="number"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(parseInt(e.target.value) || 0)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={updateUserBalance}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Update Balance
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userBalances.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div>
                        <span className="font-medium">{user.username}</span>
                        <div className="text-xs text-gray-400">{user.id}</div>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {user.balance} coins
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Temp Passwords */}
          <TabsContent value="temp" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">Generate Temporary Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Expiry (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={tempPasswordExpiry}
                      onChange={(e) => setTempPasswordExpiry(Math.max(1, Math.min(168, parseInt(e.target.value) || 24)))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={generateTempPassword}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Generate Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">Active Temporary Passwords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tempPasswords.map((temp) => (
                    <div key={temp.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div>
                        <code className="text-green-400">{temp.password}</code>
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {new Date(temp.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={temp.used ? "destructive" : "secondary"}>
                          {temp.used ? 'Used' : 'Active'}
                        </Badge>
                        <div className="text-xs text-gray-400 mt-1">
                          {getTimeRemaining(temp.expires_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Key Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Keys:</span>
                      <Badge>{keys.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Used Keys:</span>
                      <Badge variant="destructive">{keys.filter(k => k.used).length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Keys:</span>
                      <Badge className="bg-green-600">{keys.filter(k => !k.used).length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-yellow-400">User Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <Badge>{userBalances.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Coins:</span>
                      <Badge className="bg-yellow-600 text-black">
                        {userBalances.reduce((sum, user) => sum + user.balance, 0)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Balance:</span>
                      <Badge>
                        {userBalances.length > 0 
                          ? Math.round(userBalances.reduce((sum, user) => sum + user.balance, 0) / userBalances.length)
                          : 0
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Temp Passwords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Generated:</span>
                      <Badge>{tempPasswords.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <Badge className="bg-green-600">
                        {tempPasswords.filter(p => !p.used && new Date(p.expires_at) > new Date()).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Expired/Used:</span>
                      <Badge variant="destructive">
                        {tempPasswords.filter(p => p.used || new Date(p.expires_at) <= new Date()).length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Nuclear Options */}
          <TabsContent value="nuclear" className="space-y-6">
            <Card className="bg-red-900 border-red-700">
              <CardHeader>
                <CardTitle className="text-red-400">⚠️ DANGER ZONE ⚠️</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-300">These actions cannot be undone. Use with extreme caution!</p>
                <Separator className="bg-red-700" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={resetAllUserBalances}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reset All User Balances to 500
                  </Button>
                  
                  <Button
                    onClick={giveAllUsersCoins}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black"
                  >
                    Give Coins to All Users
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

export default AdminPanel;
