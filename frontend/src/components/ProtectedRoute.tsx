import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If route requires a specific role and user doesn't have it
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user's actual role
    if (user?.role === 'manager') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/live-status" replace />;
  }

  return <>{children}</>;
}

// Component to redirect authenticated users away from login
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    // Redirect to appropriate page based on role
    const redirectTo = user?.role === 'manager' ? '/dashboard' : '/live-status';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
