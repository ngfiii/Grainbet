import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Download, Trash2, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  created_at: string;
  last_sign_in_at?: string;
}

interface CoinKey {
  id: string;
  code: string;
  amount: number;
  used: boolean;
  created_at: string;
}

interface KeyStats {
  amount: number;
  active: number;
  used: number;
  total: number;
}

interface TempPasswordWithExpiry {
  password: string;
  expiresAt: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { isAdminAuthenticated, logout: logoutAdmin, addTempPassword, removeTempPassword, tempPasswords } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [keys, setKeys] = useState<CoinKey[]>([]);
  const [keyStats, setKeyStats] = useState<KeyStats[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [coinAmount, setCoinAmount] = useState(100);
  const [keyAmount, setKeyAmount] = useState(100);
  const [customKeyAmount, setCustomKeyAmount] = useState(100);
  const [keyLength, setKeyLength] = useState(12);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk generation states with limits
  const [bulkCount, setBulkCount] = useState(50);
  const [bulkAmount, setBulkAmount] = useState(100);
  
  // Temp password management
  const [newTempPassword, setNewTempPassword] = useState('');
  const [tempPasswordDuration, setTempPasswordDuration] = useState(24); // hours
  const [tempPasswordsWithExpiry, setTempPasswordsWithExpiry] = useState<TempPasswordWithExpiry[]>([]);

  // Bulk delete states
  const [deleteAmount, setDeleteAmount] = useState(100);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'active' | 'used' | 'all' | 'amount'>('active');

  // Specific delete section states
  const [specificDeleteAmount, setSpecificDeleteAmount] = useState(100);
  const [specificDeleteCount, setSpecificDeleteCount] = useState(10);
  const [showSpecificDeleteConfirm, setShowSpecificDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchUsers();
      fetchKeys();
      fetchTempPasswordsWithExpiry();
      
      // Set up real-time updates for users
      const interval = setInterval(() => {
        fetchUsers();
        fetchTempPasswordsWithExpiry();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAdminAuthenticated]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  // Calculate key statistics
  useEffect(() => {
    if (keys.length > 0) {
      const statsMap = new Map<number, KeyStats>();
      
      keys.forEach(key => {
        if (!statsMap.has(key.amount)) {
          statsMap.set(key.amount, { amount: key.amount, active: 0, used: 0, total: 0 });
        }
        const stats = statsMap.get(key.amount)!;
        stats.total++;
        if (key.used) {
          stats.used++;
        } else {
          stats.active++;
        }
      });
      
      const statsArray = Array.from(statsMap.values()).sort((a, b) => a.amount - b.amount);
      setKeyStats(statsArray);
    } else {
      setKeyStats([]);
    }
  }, [keys]);

  const fetchTempPasswordsWithExpiry = () => {
    try {
      const savedTempPasswords = localStorage.getItem('tempPasswords');
      if (savedTempPasswords) {
        const parsedPasswords: TempPasswordWithExpiry[] = JSON.parse(savedTempPasswords);
        const validPasswords = parsedPasswords.filter(tp => tp.expiresAt > Date.now());
        setTempPasswordsWithExpiry(validPasswords);
      }
    } catch (error) {
      console.error('Error parsing temp passwords:', error);
      setTempPasswordsWithExpiry([]);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('🔍 Fetching all users for admin panel...');
      
      // Get all profiles first
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, created_at');
      
      if (profileError) {
        console.error('❌ Error fetching profiles:', profileError);
      }

      // Get all user balances
      const { data: balances, error: balanceError } = await supabase
        .from('user_balances')
        .select('id, balance, created_at, updated_at');

      if (balanceError) {
        console.error('❌ Error fetching balances:', balanceError);
      }

      console.log('📋 Found profiles:', profiles?.length || 0);
      console.log('💰 Found balances:', balances?.length || 0);

      // Combine profiles and balances data
      const userMap = new Map<string, User>();

      // Add users from profiles
      if (profiles) {
        profiles.forEach(profile => {
          userMap.set(profile.id, {
            id: profile.id,
            email: profile.username || 'No Email',
            username: profile.username || 'No Username',
            balance: 0,
            created_at: profile.created_at,
            last_sign_in_at: undefined
          });
        });
      }

      // Add balance data
      if (balances) {
        balances.forEach(balance => {
          const existingUser = userMap.get(balance.id);
          if (existingUser) {
            existingUser.balance = parseFloat(balance.balance.toString());
          } else {
            // User has balance but no profile - create entry
            userMap.set(balance.id, {
              id: balance.id,
              email: 'No Profile Set',
              username: 'No Profile Set',
              balance: parseFloat(balance.balance.toString()),
              created_at: balance.created_at
            });
          }
        });
      }

      const allUsers = Array.from(userMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('✅ Combined user data:', allUsers.length);
      setUsers(allUsers);

      if (allUsers.length === 0) {
        toast.info('No users found. Users will appear after they sign up and create profiles.');
      } else {
        console.log('👥 Loaded users:', allUsers.map(u => ({ id: u.id, email: u.email, balance: u.balance })));
      }

    } catch (error) {
      console.error('💥 Error in fetchUsers:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchKeys = async () => {
    try {
      const { data } = await supabase
        .from('coin_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setKeys(data);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    setLoading(true);
    try {
      console.log('💰 Updating balance for user:', userId, 'to:', newBalance);
      
      // Check if balance record exists
      const { data: existingBalance } = await supabase
        .from('user_balances')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingBalance) {
        // Update existing balance
        const { error } = await supabase
          .from('user_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Insert new balance record
        const { error } = await supabase
          .from('user_balances')
          .insert([{ 
            id: userId, 
            balance: newBalance,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }
      
      toast.success(`✅ User balance updated to ${newBalance} coins!`);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('❌ Update balance error:', error);
      toast.error('Failed to update user balance');
    }
    setLoading(false);
  };

  const generateKey = async (amount: number) => {
    setLoading(true);
    try {
      // Generate a random code based on the specified length
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < keyLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const { error } = await supabase
        .from('coin_keys')
        .insert([{ code, amount, used: false }]);

      if (error) throw error;
      
      toast.success(`Key generated: ${code}`);
      fetchKeys();
    } catch (error) {
      console.error('Generate key error:', error);
      toast.error('Failed to generate key');
    }
    setLoading(false);
  };

  const generateBulkKeys = async () => {
    if (bulkCount < 50 || bulkCount > 10000) {
      toast.error('Bulk count must be between 50 and 10,000');
      return;
    }
    
    setLoading(true);
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const keysToInsert = [];
      
      for (let i = 0; i < bulkCount; i++) {
        let code = '';
        for (let j = 0; j < keyLength; j++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        keysToInsert.push({ code, amount: bulkAmount, used: false });
      }
      
      const { error } = await supabase
        .from('coin_keys')
        .insert(keysToInsert);

      if (error) throw error;
      
      toast.success(`✅ Generated ${bulkCount} keys with ${bulkAmount} coins each!`);
      fetchKeys();
    } catch (error) {
      console.error('Bulk generate error:', error);
      toast.error('Failed to generate bulk keys');
    }
    setLoading(false);
  };

  const bulkDeleteKeys = async (type: 'active' | 'used' | 'all' | 'amount') => {
    setLoading(true);
    try {
      let query = supabase.from('coin_keys').delete();
      
      switch (type) {
        case 'active':
          query = query.eq('used', false);
          break;
        case 'used':
          query = query.eq('used', true);
          break;
        case 'amount':
          query = query.eq('amount', deleteAmount);
          break;
        case 'all':
          // No additional filter for all
          break;
      }
      
      const { error, count } = await query;
      
      if (error) throw error;
      
      const typeText = type === 'amount' ? `${deleteAmount} coin` : type;
      toast.success(`✅ Deleted all ${typeText} keys successfully!`);
      fetchKeys();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete keys');
    }
    setLoading(false);
  };

  const deleteSpecificAmountKeys = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coin_keys')
        .delete()
        .eq('amount', specificDeleteAmount)
        .limit(specificDeleteCount);
      
      if (error) throw error;
      
      toast.success(`✅ Deleted ${specificDeleteCount} keys of ${specificDeleteAmount} coins!`);
      fetchKeys();
      setShowSpecificDeleteConfirm(false);
    } catch (error) {
      console.error('Delete specific keys error:', error);
      toast.error('Failed to delete specific keys');
    }
    setLoading(false);
  };

  const exportKeys = (filterType: 'active' | 'used' | 'all') => {
    let keysToExport = keys;
    
    switch (filterType) {
      case 'active':
        keysToExport = keys.filter(key => !key.used);
        break;
      case 'used':
        keysToExport = keys.filter(key => key.used);
        break;
      case 'all':
        keysToExport = keys;
        break;
    }
    
    const exportData = keysToExport.map(key => 
      `${key.code} - ${key.amount} coins`
    ).join('\n');
    
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coin_keys_${filterType}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${keysToExport.length} ${filterType} keys!`);
  };

  const deleteKey = async (keyId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coin_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
      
      toast.success('Key deleted successfully!');
      fetchKeys();
    } catch (error) {
      toast.error('Failed to delete key');
    }
    setLoading(false);
  };

  const generateTempPassword = () => {
    const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNewTempPassword(password);
  };

  const addTempPasswordHandler = () => {
    if (newTempPassword.trim()) {
      // Convert hours to milliseconds for expiration
      const expirationTime = Date.now() + (tempPasswordDuration * 60 * 60 * 1000);
      addTempPassword(newTempPassword.trim(), expirationTime);
      toast.success(`Temporary password added: ${newTempPassword} (expires in ${tempPasswordDuration} hours)`);
      setNewTempPassword('');
      fetchTempPasswordsWithExpiry();
    }
  };

  const removeTempPasswordHandler = (password: string) => {
    removeTempPassword(password);
    toast.success('Temporary password removed');
    fetchTempPasswordsWithExpiry();
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Quick actions for common tasks
  const setAllUsersBalance = async (amount: number) => {
    if (!confirm(`Are you sure you want to set ALL users balance to ${amount} coins?`)) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_balances')
        .update({ balance: amount, updated_at: new Date().toISOString() })
        .neq('id', 'dummy'); // Update all records
      
      if (error) throw error;
      
      toast.success(`✅ Set all users balance to ${amount} coins!`);
      fetchUsers();
    } catch (error) {
      console.error('Set all balance error:', error);
      toast.error('Failed to set all users balance');
    }
    setLoading(false);
  };

  // Redirect if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-red-400 mb-4 font-mono">Access Denied</h1>
          <p className="text-gray-300 mb-8 font-mono">
            You need to authenticate to access the admin panel.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 text-lg font-mono"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 text-center font-mono">
            🔧 Admin Panel
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={fetchUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
            >
              🔄 Refresh Users
            </Button>
            <Button
              onClick={logoutAdmin}
              className="bg-red-600 hover:bg-red-700 text-white font-mono"
            >
              Logout Admin
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="users">👥 User Management</TabsTrigger>
            <TabsTrigger value="keys">🔑 Key Management</TabsTrigger>
            <TabsTrigger value="passwords">🔐 Temp Passwords</TabsTrigger>
            <TabsTrigger value="tools">🛠️ Admin Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">💰 User Balance Control</h2>
              
              <div className="grid gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-gray-700 border-gray-600 text-white p-2 rounded"
                  >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email}) - {user.balance} coins
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">New Balance</label>
                  <Input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <Button
                  onClick={() => selectedUser && updateUserBalance(selectedUser, coinAmount)}
                  disabled={!selectedUser || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? '⏳ Updating...' : '💰 Update Balance'}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">👥 All Users ({filteredUsers.length})</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white w-64"
                    />
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    {searchTerm ? (
                      <p>No users found matching "{searchTerm}"</p>
                    ) : (
                      <>
                        <p>No users found.</p>
                        <p className="text-sm mt-2">Users will appear here after they sign up.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-gray-300">Username</TableHead>
                          <TableHead className="text-gray-300">Email</TableHead>
                          <TableHead className="text-gray-300">Balance</TableHead>
                          <TableHead className="text-gray-300">Created</TableHead>
                          <TableHead className="text-gray-300">User ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(user => (
                          <TableRow key={user.id} className="border-gray-600 hover:bg-gray-600">
                            <TableCell className="text-white font-semibold">
                              {user.username}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <span className="text-yellow-400 font-bold text-lg">
                                {user.balance}
                              </span>
                              <span className="text-gray-400 text-sm ml-1">coins</span>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-500 text-xs font-mono">
                              {user.id.substring(0, 8)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">🔑 Key Management & Statistics</h2>
              
              {/* Key Statistics */}
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">📊 Key Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {keyStats.map(stat => (
                    <div key={stat.amount} className="bg-gray-600 p-3 rounded text-center">
                      <div className="text-yellow-400 font-bold text-lg">{stat.amount}</div>
                      <div className="text-xs text-gray-300">coins</div>
                      <div className="text-green-400 text-sm">{stat.active} active</div>
                      <div className="text-red-400 text-sm">{stat.used} used</div>
                      <div className="text-gray-400 text-xs">{stat.total} total</div>
                    </div>
                  ))}
                </div>
                {keyStats.length === 0 && (
                  <div className="text-gray-400 text-center py-4">No keys generated yet</div>
                )}
              </div>

              {/* Specific Delete Section */}
              <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-600 mb-6">
                <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center">
                  <Trash2 className="mr-2 h-5 w-5" />
                  🎯 Delete Specific Amount Keys
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Key Amount (coins)</label>
                    <Input
                      type="number"
                      value={specificDeleteAmount}
                      onChange={(e) => setSpecificDeleteAmount(parseInt(e.target.value) || 100)}
                      className="bg-gray-700 border-gray-600 text-white"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Keys to Delete</label>
                    <Input
                      type="number"
                      value={specificDeleteCount}
                      onChange={(e) => setSpecificDeleteCount(parseInt(e.target.value) || 10)}
                      className="bg-gray-700 border-gray-600 text-white"
                      min={1}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => setShowSpecificDeleteConfirm(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      Delete {specificDeleteCount} of {specificDeleteAmount} coin keys
                    </Button>
                  </div>
                </div>
                
                {showSpecificDeleteConfirm && (
                  <div className="bg-orange-800/50 p-3 rounded border border-orange-500">
                    <p className="text-orange-200 mb-3">
                      ⚠️ Are you sure you want to delete {specificDeleteCount} keys of {specificDeleteAmount} coins each?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={deleteSpecificAmountKeys}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {loading ? '⏳ Deleting...' : 'Yes, Delete Them'}
                      </Button>
                      <Button
                        onClick={() => setShowSpecificDeleteConfirm(false)}
                        className="bg-gray-600 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Delete Section */}
              <div className="bg-red-900/20 p-4 rounded-lg border border-red-600 mb-6">
                <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  🗑️ Bulk Delete Keys
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  <Button
                    onClick={() => { setDeleteType('active'); setShowDeleteConfirm(true); }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete All Active
                  </Button>
                  <Button
                    onClick={() => { setDeleteType('used'); setShowDeleteConfirm(true); }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete All Used
                  </Button>
                  <Button
                    onClick={() => { setDeleteType('all'); setShowDeleteConfirm(true); }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete ALL Keys
                  </Button>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={deleteAmount}
                      onChange={(e) => setDeleteAmount(parseInt(e.target.value) || 100)}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                      placeholder="Amount"
                    />
                    <Button
                      onClick={() => { setDeleteType('amount'); setShowDeleteConfirm(true); }}
                      className="bg-red-600 hover:bg-red-700 text-xs px-2"
                    >
                      Delete {deleteAmount}s
                    </Button>
                  </div>
                </div>
                
                {showDeleteConfirm && (
                  <div className="bg-red-800/50 p-3 rounded border border-red-500">
                    <p className="text-red-200 mb-3">
                      ⚠️ Are you sure you want to delete all {deleteType === 'amount' ? `${deleteAmount} coin` : deleteType} keys? This action cannot be undone!
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => bulkDeleteKeys(deleteType)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {loading ? '⏳ Deleting...' : 'Yes, Delete All'}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-gray-600 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Key Length</label>
                  <Input
                    type="number"
                    value={keyLength}
                    onChange={(e) => setKeyLength(Math.max(6, Math.min(20, parseInt(e.target.value) || 12)))}
                    className="bg-gray-700 border-gray-600 text-white"
                    min={6}
                    max={20}
                  />
                  <p className="text-sm text-gray-400 mt-1">Between 6 and 20 characters</p>
                </div>

                {/* Bulk Generation Section */}
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-bold text-white mb-3">🔥 Bulk Generate Keys</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Number of Keys (50-10,000)</label>
                      <Input
                        type="number"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(Math.max(50, Math.min(10000, parseInt(e.target.value) || 50)))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min={50}
                        max={10000}
                      />
                      <p className="text-xs text-gray-400 mt-1">Min: 50, Max: 10,000</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Coins per Key</label>
                      <Input
                        type="number"
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(Math.max(1, parseInt(e.target.value) || 100))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min={1}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={generateBulkKeys}
                        disabled={loading || bulkCount < 50 || bulkCount > 10000}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {loading ? '⏳ Generating...' : `Generate ${bulkCount} Keys`}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Single Key Generation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[5, 10, 50, 100, 500].map(amount => (
                    <Button
                      key={amount}
                      onClick={() => generateKey(amount)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Generate {amount} Key
                    </Button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={customKeyAmount}
                    onChange={(e) => setCustomKeyAmount(parseInt(e.target.value) || 0)}
                    placeholder="Custom amount"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => generateKey(customKeyAmount)}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Generate Custom
                  </Button>
                </div>
              </div>

              {/* Export Section */}
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">📁 Export Keys</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={() => exportKeys('active')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Active
                  </Button>
                  <Button
                    onClick={() => exportKeys('used')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Used
                  </Button>
                  <Button
                    onClick={() => exportKeys('all')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Generated Keys ({keys.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {keys.slice(0, 100).map(key => (
                    <div key={key.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                      <div>
                        <span className="text-white font-mono">{key.code}</span>
                        <span className="ml-2 text-yellow-400">({key.amount} coins)</span>
                        <span className={`ml-2 ${key.used ? 'text-red-400' : 'text-green-400'}`}>
                          {key.used ? 'USED' : 'ACTIVE'}
                        </span>
                      </div>
                      <Button
                        onClick={() => deleteKey(key.id)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  {keys.length > 100 && (
                    <div className="text-gray-400 text-center py-2">
                      Showing first 100 keys. Total: {keys.length} keys
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="passwords" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">🔐 Temporary Password Management</h2>
              
              <div className="grid gap-4 mb-6">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    placeholder="Enter temporary password"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={generateTempPassword}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Generate
                  </Button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (hours)</label>
                  <Input
                    type="number"
                    value={tempPasswordDuration}
                    onChange={(e) => setTempPasswordDuration(Math.max(0.001, Math.min(720, parseFloat(e.target.value) || 24)))}
                    className="bg-gray-700 border-gray-600 text-white"
                    min={0.001}
                    max={720}
                    step={0.001}
                  />
                  <p className="text-sm text-gray-400 mt-1">From 1 second (0.001) to 30 days (720 hours)</p>
                </div>
                
                <Button
                  onClick={addTempPasswordHandler}
                  disabled={!newTempPassword.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Password ({tempPasswordDuration}h duration)
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Active Temporary Passwords</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {tempPasswordsWithExpiry.map((passwordObj, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                      <div>
                        <span className="text-white font-mono">{passwordObj.password}</span>
                        <span className="ml-3 text-blue-400 text-sm">
                          Time remaining: {formatTimeRemaining(passwordObj.expiresAt)}
                        </span>
                      </div>
                      <Button
                        onClick={() => removeTempPasswordHandler(passwordObj.password)}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {tempPasswordsWithExpiry.length === 0 && (
                    <div className="text-gray-400 text-center py-4">
                      No temporary passwords active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">🛠️ Admin Tools & Quick Actions</h2>
              
              <div className="grid gap-6">
                {/* Quick Balance Actions */}
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-bold text-white mb-3">💰 Quick Balance Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      onClick={() => setAllUsersBalance(1000)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Set All to 1000
                    </Button>
                    <Button
                      onClick={() => setAllUsersBalance(5000)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Set All to 5000
                    </Button>
                    <Button
                      onClick={() => setAllUsersBalance(0)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reset All to 0
                    </Button>
                    <Button
                      onClick={() => setAllUsersBalance(6900)}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 text-black"
                    >
                      Set All to MAX
                    </Button>
                  </div>
                </div>

                {/* System Stats */}
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-bold text-white mb-3">📊 System Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-600 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-blue-400">{users.length}</div>
                      <div className="text-sm text-gray-300">Total Users</div>
                    </div>
                    <div className="bg-gray-600 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-green-400">{keys.filter(k => !k.used).length}</div>
                      <div className="text-sm text-gray-300">Active Keys</div>
                    </div>
                    <div className="bg-gray-600 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-red-400">{keys.filter(k => k.used).length}</div>
                      <div className="text-sm text-gray-300">Used Keys</div>
                    </div>
                    <div className="bg-gray-600 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-yellow-400">{users.reduce((sum, u) => sum + u.balance, 0).toFixed(0)}</div>
                      <div className="text-sm text-gray-300">Total Coins</div>
                    </div>
                  </div>
                </div>

                {/* Database Actions */}
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-bold text-white mb-3">🗄️ Database Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button
                      onClick={fetchUsers}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      🔄 Refresh Users
                    </Button>
                    <Button
                      onClick={fetchKeys}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      🔄 Refresh Keys
                    </Button>
                    <Button
                      onClick={() => {
                        fetchUsers();
                        fetchKeys();
                      }}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      🔄 Refresh All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
