
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const RedemptionTester = () => {
  const { user } = useAuth();
  const [testCode, setTestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  const addDebug = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { timestamp, message, data }]);
    console.log(`[${timestamp}] ${message}`, data);
  };

  const generateTestKey = async () => {
    setLoading(true);
    setDebugInfo([]);
    
    try {
      // Generate a simple test code
      const code = 'TEST' + Math.floor(Math.random() * 10000);
      const amount = 100;
      
      addDebug('Generating test key...', { code, amount });
      
      const { data, error } = await supabase
        .from('coin_keys')
        .insert([{ code, amount }])
        .select()
        .single();

      if (error) {
        addDebug('Error generating key', error);
        toast.error('Failed to generate test key');
        return;
      }

      addDebug('Key generated successfully', data);
      setTestCode(code);
      toast.success(`Test key generated: ${code}`);
      
    } catch (error) {
      addDebug('Unexpected error generating key', error);
      toast.error('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testRedemption = async () => {
    if (!testCode.trim()) {
      toast.error('No test code available');
      return;
    }

    setLoading(true);
    const upperCode = testCode.toUpperCase().trim();
    
    try {
      addDebug('Starting redemption test...', { code: upperCode, user: user?.id });

      // Step 1: Check if key exists
      addDebug('Step 1: Checking if key exists...');
      const { data: keys, error: fetchError } = await supabase
        .from('coin_keys')
        .select('*')
        .eq('code', upperCode);

      addDebug('Fetch result', { keys, fetchError });

      if (fetchError) {
        addDebug('Database error during fetch', fetchError);
        toast.error('Database error occurred');
        return;
      }

      if (!keys || keys.length === 0) {
        addDebug('No keys found with this code');
        toast.error('Key not found');
        return;
      }

      const key = keys[0];
      addDebug('Found key', key);

      if (key.used) {
        addDebug('Key is already used');
        toast.error('Key already used');
        return;
      }

      // Step 2: Mark as used
      addDebug('Step 2: Marking key as used...');
      const { error: updateError } = await supabase
        .from('coin_keys')
        .update({ 
          used: true, 
          used_by: user?.id || 'anonymous',
          used_at: new Date().toISOString()
        })
        .eq('id', key.id);

      if (updateError) {
        addDebug('Error updating key', updateError);
        toast.error('Failed to update key');
        return;
      }

      addDebug('Key marked as used successfully');

      // Step 3: Check user balance
      addDebug('Step 3: Checking user balance...');
      let currentBalance = 0;
      
      if (user) {
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (balanceError) {
          addDebug('Error fetching balance', balanceError);
        } else {
          currentBalance = parseFloat(balanceData.balance.toString());
          addDebug('Current balance', currentBalance);
        }
      }

      // Step 4: Update balance
      const newBalance = currentBalance + key.amount;
      addDebug('Step 4: Updating balance...', { from: currentBalance, to: newBalance, amount: key.amount });

      if (user) {
        const { error: balanceUpdateError } = await supabase
          .from('user_balances')
          .update({ balance: newBalance })
          .eq('id', user.id);

        if (balanceUpdateError) {
          addDebug('Error updating balance', balanceUpdateError);
          toast.error('Failed to update balance');
          return;
        }
      }

      addDebug('SUCCESS: Redemption completed!');
      toast.success(`Successfully redeemed ${key.amount} coins!`);
      
    } catch (error) {
      addDebug('Unexpected error during redemption', error);
      toast.error('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo([]);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl">
      <h3 className="text-xl font-bold text-yellow-400 mb-4 font-mono">Redemption System Tester</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Button
            onClick={generateTestKey}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 font-mono"
          >
            {loading ? 'Generating...' : 'Generate Test Key'}
          </Button>
          
          <Button
            onClick={testRedemption}
            disabled={loading || !testCode}
            className="bg-green-600 hover:bg-green-700 font-mono"
          >
            {loading ? 'Testing...' : 'Test Redemption'}
          </Button>
          
          <Button
            onClick={clearDebug}
            className="bg-gray-600 hover:bg-gray-700 font-mono"
          >
            Clear Debug
          </Button>
        </div>

        {testCode && (
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-white font-mono">Test Code: <span className="text-yellow-400">{testCode}</span></p>
          </div>
        )}
      </div>

      {debugInfo.length > 0 && (
        <div className="bg-black p-4 rounded max-h-64 overflow-y-auto">
          <h4 className="text-green-400 font-mono mb-2">Debug Log:</h4>
          {debugInfo.map((log, index) => (
            <div key={index} className="text-xs text-gray-300 font-mono mb-1">
              <span className="text-blue-400">[{log.timestamp}]</span> {log.message}
              {log.data && (
                <pre className="text-yellow-300 ml-4 mt-1">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
