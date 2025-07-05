
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  authenticateAdmin: (password: string) => boolean;
  logout: () => void;
  addTempPassword: (password: string) => void;
  removeTempPassword: (password: string) => void;
  tempPasswords: string[];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const MASTER_PASSWORD = "Dahmesisagod12_";

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [tempPasswords, setTempPasswords] = useState<string[]>([]);

  // Load saved auth state and temp passwords on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin-authenticated');
    const savedTempPasswords = localStorage.getItem('admin-temp-passwords');
    
    if (savedAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
    
    if (savedTempPasswords) {
      setTempPasswords(JSON.parse(savedTempPasswords));
    }
  }, []);

  const authenticateAdmin = (password: string) => {
    if (password === MASTER_PASSWORD || tempPasswords.includes(password)) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('admin-authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('admin-authenticated');
  };

  const addTempPassword = (password: string) => {
    const newTempPasswords = [...tempPasswords, password];
    setTempPasswords(newTempPasswords);
    localStorage.setItem('admin-temp-passwords', JSON.stringify(newTempPasswords));
  };

  const removeTempPassword = (password: string) => {
    const newTempPasswords = tempPasswords.filter(p => p !== password);
    setTempPasswords(newTempPasswords);
    localStorage.setItem('admin-temp-passwords', JSON.stringify(newTempPasswords));
  };

  const contextValue = {
    isAdminAuthenticated,
    authenticateAdmin,
    logout,
    addTempPassword,
    removeTempPassword,
    tempPasswords
  };

  return (
    <AdminContext.Provider value={contextValue}>
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
