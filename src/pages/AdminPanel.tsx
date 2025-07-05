import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  created_at: string;
}

interface CoinKey {
  id: string;
  code: string;
  amount: number;
  used: boolean;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { isAdminAuthenticated, logout: logoutAdmin, addTempPassword, removeTempPassword, tempPasswords } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [keys, setKeys] = useState<CoinKey[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [coinAmount, setCoinAmount] = useState(100);
  const [keyAmount, setKeyAmount] = useState(100);
  const [customKeyAmount, setCustomKeyAmount] = useState(100);
  const [keyLength, setKeyLength] = useState(12);
  const [loading, setLoading] = useState(false);
  
  // Temp password management
  const [newTempPassword, setNewTempPassword] = useState('');

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchUsers();
      fetchKeys();
    }
  }, [isAdminAuthenticated]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for admin panel...');
      
      // Get all users from auth (this requires service role but we'll try with profiles)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, created_at');
      
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        toast.error('Failed to fetch user profiles');
        return;
      }

      // Get user balances
      const { data: balances, error: balanceError } = await supabase
        .from('user_balances')
        .select('id, balance');

      if (balanceError) {
        console.error('Error fetching balances:', balanceError);
        toast.error('Failed to fetch user balances');
        return;
      }

      console.log('Profiles:', profiles);
      console.log('Balances:', balances);

      // For users without profiles, we need to handle them differently
      // Let's also try to get auth users if possible (this might not work with RLS)
      let authUsers = [];
      try {
        // This might fail due to RLS, but let's try
        const { data: authData } = await supabase.auth.admin.listUsers();
        if (authData?.users) {
          authUsers = authData.users;
        }
      } catch (error) {
        console.log('Cannot access auth users directly, using profiles only');
      }

      // Combine the data
      const combined: User[] = [];

      // First add users from profiles
      if (profiles) {
        profiles.forEach(profile => {
          const balance = balances?.find(b => b.id === profile.id)?.balance || 0;
          combined.push({
            id: profile.id,
            email: profile.username || 'Unknown', // Using username as email fallback
            username: profile.username || 'Unknown',
            balance: parseFloat(balance.toString()),
            created_at: profile.created_at
          });
        });
      }

      // Add users from balances that don't have profiles
      if (balances) {
        balances.forEach(balance => {
          const existingUser = combined.find(u => u.id === balance.id);
          if (!existingUser) {
            combined.push({
              id: balance.id,
              email: 'No Profile',
              username: 'No Profile',
              balance: parseFloat(balance.balance.toString()),
              created_at: new Date().toISOString()
            });
          }
        });
      }

      console.log('Combined users:', combined);
      setUsers(combined);

      if (combined.length === 0) {
        toast.info('No users found. Users appear after they sign up and create profiles.');
      }

    } catch (error) {
      console.error('Error in fetchUsers:', error);
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
      console.log('Updating balance for user:', userId, 'to:', newBalance);
      
      // First check if balance record exists
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
      
      toast.success('User balance updated successfully!');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Update balance error:', error);
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
      addTempPassword(newTempPassword.trim());
      toast.success(`Temporary password added: ${newTempPassword}`);
      setNewTempPassword('');
    }
  };

  const removeTempPasswordHandler = (password: string) => {
    removeTempPassword(password);
    toast.success('Temporary password removed');
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
              Refresh Users
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
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="keys">Key Management</TabsTrigger>
            <TabsTrigger value="passwords">Temp Passwords</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">User Balance Control</h2>
              
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
                        {user.username} ({user.email}) - Balance: {user.balance}
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
                  {loading ? 'Updating...' : 'Update Balance'}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">All Users ({users.length})</h3>
                {users.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    <p>No users found.</p>
                    <p className="text-sm mt-2">Users will appear here after they sign up and use the app.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                        <div>
                          <span className="text-white font-semibold">{user.username}</span>
                          <span className="text-gray-300 text-sm ml-2">({user.email})</span>
                          <div className="text-xs text-gray-400">ID: {user.id}</div>
                        </div>
                        <span className="text-yellow-400 font-bold">{user.balance} coins</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">Generate Coin Keys</h2>
              
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

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Generated Keys</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {keys.map(key => (
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
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="passwords" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">Temporary Password Management</h2>
              
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
                  <Button
                    onClick={addTempPasswordHandler}
                    disabled={!newTempPassword.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Add Password
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Active Temporary Passwords</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {tempPasswords.map((password, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                      <span className="text-white font-mono">{password}</span>
                      <Button
                        onClick={() => removeTempPasswordHandler(password)}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {tempPasswords.length === 0 && (
                    <div className="text-gray-400 text-center py-4">
                      No temporary passwords active
                    </div>
                  )}
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
