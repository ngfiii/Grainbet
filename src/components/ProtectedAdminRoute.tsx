import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}
export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const ADMIN_PASSWORD = 'Dahmesisagod12_';
  const checkTempPassword = async (inputPassword: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('temp_passwords').select('*').eq('password', inputPassword).eq('used', false).gt('expires_at', new Date().toISOString()).single();
      if (error || !data) return false;

      // Mark as used
      await supabase.from('temp_passwords').update({
        used: true
      }).eq('id', data.id);
      return true;
    } catch (error) {
      return false;
    }
  };
  const handleLogin = async () => {
    setLoading(true);

    // Check if it's the main admin password
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Admin access granted!');
      setLoading(false);
      return;
    }

    // Check if it's a valid temporary password
    const isTempPasswordValid = await checkTempPassword(password);
    if (isTempPasswordValid) {
      setIsAuthenticated(true);
      toast.success('Admin access granted with temporary key!');
      setLoading(false);
      return;
    }
    toast.error('Invalid password or expired temporary key');
    setPassword('');
    setLoading(false);
  };
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg border border-gray-700 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img alt="GrainBet Logo" className="w-8 h-8" src="/lovable-uploads/eb36a575-cc27-4b5b-b6d3-d5365d0b7686.png" />
              <h1 className="text-2xl font-bold text-yellow-400 font-mono">GrainBet</h1>
            </div>
            <h2 className="text-xl font-bold text-red-400 font-mono">Admin Access Required</h2>
            <p className="text-gray-300 mt-2 font-mono text-sm">
              Enter admin password or temporary key
            </p>
          </div>

          <div className="space-y-4">
            <Input type="password" placeholder="Admin password or temporary key" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} className="bg-gray-700 border-gray-600 text-white font-mono" disabled={loading} />

            <Button onClick={handleLogin} disabled={!password || loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold font-mono">
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </Button>

            <Button onClick={() => window.history.back()} variant="ghost" className="w-full text-gray-400 hover:text-white font-mono">
              Go Back
            </Button>
          </div>
        </div>
      </div>;
  }
  return <>{children}</>;
};