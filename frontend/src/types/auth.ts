export type UserRole = 'user' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register?: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isManager: boolean;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  capacity: number;
  imageUrl?: string;
  videoUrl?: string;
  videoAnalyzed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
