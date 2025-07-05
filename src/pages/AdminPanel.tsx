import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  balance: number;
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
  const [loading, setLoading] = useState(false);
  
  // Temp password management
  const [newTempPassword, setNewTempPassword] = useState('');

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchUsers();
      fetchKeys();
    }
  }, [isAdminAuthenticated]);

  // Check if user is admin (ngfi) - case insensitive
  const isAdmin = user?.email?.toLowerCase() === 'ngfi' || user?.id === 'ngfi';

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username');
      
      const { data: balances } = await supabase
        .from('user_balances')
        .select('id, balance');

      if (profiles && balances) {
        const combined = profiles.map(profile => ({
          id: profile.id,
          username: profile.username || 'Unknown',
          balance: balances.find(b => b.id === profile.id)?.balance || 0
        }));
        setUsers(combined);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
      const { error } = await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('User balance updated successfully!');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user balance');
    }
    setLoading(false);
  };

  const generateKey = async (amount: number) => {
    setLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 15).toUpperCase();
      
      const { error } = await supabase
        .from('coin_keys')
        .insert([{ code, amount, used: false }]);

      if (error) throw error;
      
      toast.success(`Key generated: ${code}`);
      fetchKeys();
    } catch (error) {
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
          <Button
            onClick={logoutAdmin}
            className="bg-red-600 hover:bg-red-700 text-white font-mono"
          >
            Logout Admin
          </Button>
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
                        {user.username} (Balance: {user.balance})
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
                  Update Balance
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">All Users</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {users.map(user => (
                    <div key={user.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                      <span className="text-white">{user.username}</span>
                      <span className="text-yellow-400">{user.balance} coins</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">Generate Coin Keys</h2>
              
              <div className="grid gap-4 mb-6">
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
