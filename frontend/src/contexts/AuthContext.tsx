import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials for demo purposes
const MOCK_CREDENTIALS = {
  manager: {
    email: 'admin@crowdmonitor.com',
    password: 'admin@321',
    role: 'manager' as UserRole,
  },
  user: {
    email: 'user@example.com',
    password: 'user123',
    role: 'user' as UserRole,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // If role is 'user', check locally registered users first
    if (role === 'user') {
      try {
        const stored = localStorage.getItem('local_users');
        const localUsers = stored ? JSON.parse(stored) : [];
        const found = localUsers.find((u: any) => u.email === email && u.password === password && u.role === 'user');
        if (found) {
          const newUser: User = {
            id: found.id || Math.random().toString(36).substr(2, 9),
            email: found.email,
            name: found.name || 'Regular User',
            role: 'user',
          };
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
          return true;
        }
      } catch (err) {
        console.error('Error reading local users:', err);
      }
    }

    // Check credentials based on role (demo/mock)
    const credentials = role === 'manager' ? MOCK_CREDENTIALS.manager : MOCK_CREDENTIALS.user;
    if (email === credentials.email && password === credentials.password) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: role === 'manager' ? 'Manager User' : 'Regular User',
        role,
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    }

    return false;
  };

  // Register a new regular user (only role 'user' allowed)
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Prevent creating manager accounts via signup
    if (!email || !password) return false;

    try {
      const stored = localStorage.getItem('local_users');
      const localUsers = stored ? JSON.parse(stored) : [];

      // Prevent duplicate email
      if (localUsers.find((u: any) => u.email === email)) {
        return false;
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        password,
        role: 'user',
      };

      localUsers.push(newUser);
      localStorage.setItem('local_users', JSON.stringify(localUsers));

      // Auto-login after registration
      const authedUser: User = { id: newUser.id, email: newUser.email, name: newUser.name, role: 'user' };
      setUser(authedUser);
      localStorage.setItem('user', JSON.stringify(authedUser));
      return true;
    } catch (err) {
      console.error('Error registering user:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isManager: user?.role === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
