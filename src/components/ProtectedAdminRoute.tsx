
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-4 font-mono">GrainBet</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-300 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and is admin
  const isAdmin = user?.email?.toLowerCase() === 'ngfi' || user?.id === 'ngfi';

  if (!user || !isAdmin) {
    // Redirect to home page if not authenticated or not admin
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
