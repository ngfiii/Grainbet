
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  tempPasswords: string[];
  addTempPassword: (password: string, expirationTime?: number) => void;
  removeTempPassword: (password: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface TempPassword {
  password: string;
  expiresAt: number;
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [tempPasswordsData, setTempPasswordsData] = useState<TempPassword[]>([]);

  // PERMANENT admin password
  const MASTER_PASSWORD = 'Dahmesisagod12_';

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAdminAuthenticated(true);
    }
    
    // Load temp passwords from localStorage
    const savedTempPasswords = localStorage.getItem('tempPasswords');
    if (savedTempPasswords) {
      try {
        const parsedPasswords: TempPassword[] = JSON.parse(savedTempPasswords);
        // Filter out expired passwords
        const validPasswords = parsedPasswords.filter(tp => tp.expiresAt > Date.now());
        setTempPasswordsData(validPasswords);
        
        // Update localStorage if we removed expired passwords
        if (validPasswords.length !== parsedPasswords.length) {
          localStorage.setItem('tempPasswords', JSON.stringify(validPasswords));
        }
      } catch (error) {
        console.error('Error parsing temp passwords:', error);
        setTempPasswordsData([]);
      }
    }
  }, []);

  // Clean up expired passwords periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTempPasswordsData(prevPasswords => {
        const validPasswords = prevPasswords.filter(tp => tp.expiresAt > Date.now());
        if (validPasswords.length !== prevPasswords.length) {
          localStorage.setItem('tempPasswords', JSON.stringify(validPasswords));
        }
        return validPasswords;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const login = (password: string): boolean => {
    // Check master password
    if (password === MASTER_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      return true;
    }
    
    // Check temporary passwords
    const currentTime = Date.now();
    const validTempPassword = tempPasswordsData.find(
      tp => tp.password === password && tp.expiresAt > currentTime
    );
    
    if (validTempPassword) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
  };

  const addTempPassword = (password: string, expirationTime?: number) => {
    const expiresAt = expirationTime || (Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
    const newTempPassword: TempPassword = { password, expiresAt };
    
    setTempPasswordsData(prev => {
      const updated = [...prev, newTempPassword];
      localStorage.setItem('tempPasswords', JSON.stringify(updated));
      return updated;
    });
  };

  const removeTempPassword = (password: string) => {
    setTempPasswordsData(prev => {
      const updated = prev.filter(tp => tp.password !== password);
      localStorage.setItem('tempPasswords', JSON.stringify(updated));
      return updated;
    });
  };

  // Get only the password strings for display (filtering expired ones)
  const tempPasswords = tempPasswordsData
    .filter(tp => tp.expiresAt > Date.now())
    .map(tp => tp.password);

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      login,
      logout,
      tempPasswords,
      addTempPassword,
      removeTempPassword
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
