
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Download, Key, Clock } from 'lucide-react';

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

const AdminPanel = () => {
  const [coinKeys, setCoinKeys] = useState<CoinKey[]>([]);
  const [tempPasswords, setTempPasswords] = useState<TempPassword[]>([]);
  const [newKeyAmount, setNewKeyAmount] = useState(100);
  const [newKeyQuantity, setNewKeyQuantity] = useState(1);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [tempPasswordDuration, setTempPasswordDuration] = useState(24); // hours
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

  useEffect(() => {
    fetchCoinKeys();
    fetchTempPasswords();
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
        amount: newKeyAmount,
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
        expires_at: expiresAt.toISOString(),
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

  const exportKeysToTxt = () => {
    const keysList = coinKeys
      .filter(key => !key.used)
      .map(key => `${key.code} - ${key.amount} coins`)
      .join('\n');

    const blob = new Blob([keysList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grainbet-keys-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Keys exported to TXT file');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 md:space-x-3 mb-4">
            <img 
              src="/lovable-uploads/fd6e96d2-a80d-4fd1-a06f-0c3acbef3fb5.png" 
              alt="GrainBet Logo" 
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-red-400 font-mono">Admin Panel</h1>
          </div>
          <p className="text-gray-300 font-mono text-sm md:text-base">Manage coin keys and temporary access</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Coin Keys Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                <Key className="w-5 h-5" />
                Coin Keys Management
              </CardTitle>
              <CardDescription className="text-gray-300">
                Create and manage coin redemption keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono mb-2">Amount per key</label>
                  <Input
                    type="number"
                    value={newKeyAmount}
                    onChange={(e) => setNewKeyAmount(parseInt(e.target.value) || 100)}
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2">Quantity</label>
                  <Input
                    type="number"
                    value={newKeyQuantity}
                    onChange={(e) => setNewKeyQuantity(parseInt(e.target.value) || 1)}
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    min={1}
                    max={50}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={createCoinKeys}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 font-mono flex-1"
                >
                  Create Keys
                </Button>
                <Button
                  onClick={exportKeysToTxt}
                  variant="outline"
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black font-mono"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to TXT
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {coinKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`p-3 rounded border text-sm ${
                      key.used
                        ? 'bg-gray-700 border-gray-600 opacity-60'
                        : 'bg-gray-750 border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-mono flex-1 min-w-0">
                        <div className="truncate">{key.code}</div>
                        <div className="text-yellow-400">{key.amount} coins</div>
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
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Temporary Passwords Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-blue-400 font-mono flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Temporary Access Keys
              </CardTitle>
              <CardDescription className="text-gray-300">
                Create temporary admin access passwords
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-mono mb-2">New temporary password</label>
                <Input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-mono mb-2">Duration (hours)</label>
                <Input
                  type="number"
                  value={tempPasswordDuration}
                  onChange={(e) => setTempPasswordDuration(parseInt(e.target.value) || 24)}
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                  min={1}
                  max={168} // 1 week max
                />
              </div>

              <Button
                onClick={createTempPassword}
                disabled={loading || !newTempPassword.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 font-mono"
              >
                Create Temporary Key
              </Button>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {tempPasswords.map((temp) => (
                  <div
                    key={temp.id}
                    className={`p-3 rounded border text-sm ${
                      temp.used || isExpired(temp.expires_at)
                        ? 'bg-gray-700 border-gray-600 opacity-60'
                        : 'bg-gray-750 border-gray-600'
                    }`}
                  >
                    <div className="font-mono">
                      <div className="truncate font-medium">{temp.password}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Expires: {new Date(temp.expires_at).toLocaleString()}
                      </div>
                      <div className="text-xs">
                        Status: {
                          temp.used
                            ? <span className="text-red-400">Used</span>
                            : isExpired(temp.expires_at)
                            ? <span className="text-orange-400">Expired</span>
                            : <span className="text-green-400">Active</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-purple-400 font-mono">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {coinKeys.filter(k => !k.used).length}
                </div>
                <div className="text-sm text-gray-400">Available Keys</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400 font-mono">
                  {coinKeys.filter(k => k.used).length}
                </div>
                <div className="text-sm text-gray-400">Used Keys</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 font-mono">
                  {tempPasswords.filter(t => !t.used && !isExpired(t.expires_at)).length}
                </div>
                <div className="text-sm text-gray-400">Active Temp Keys</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400 font-mono">
                  {coinKeys.reduce((sum, k) => sum + (k.used ? 0 : k.amount), 0)}
                </div>
                <div className="text-sm text-gray-400">Total Coins Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
