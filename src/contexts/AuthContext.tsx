import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import type { UserDto, LoginDto, PageAccessDto } from '@/types/auth';

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pageAccesses: PageAccessDto[];
  login: (credentials: LoginDto) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (pageName: string, action: 'View' | 'Add' | 'Edit' | 'Delete') => boolean;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageAccesses, setPageAccesses] = useState<PageAccessDto[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = authService.getUser();
        const savedToken = authService.getToken();
        const pageAccesses = authService.getPageAccesses();

        if (savedUser && savedToken) {
          setUser(savedUser);
          setToken(savedToken);
          setPageAccesses(pageAccesses || []);
          // Load user permissions
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        authService.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginDto): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await authService.login(credentials);

      setUser(response.user);
      setToken(response.token);
      setPageAccesses(response.pageAccesses);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setPageAccesses([]);
      setIsLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const hasPermission = (
    pageName: string,
    action: 'View' | 'Add' | 'Edit' | 'Delete' = 'View'
  ): boolean => {
    const page = pageAccesses.find((p) => p.pageName === pageName);
    if (!page) return false;

    switch (action) {
      case 'View':
        return page.isView;
      case 'Add':
        return page.isAdd;
      case 'Edit':
        return page.isEdit;
      case 'Delete':
        return page.isDelete;
      default:
        return false;
    }
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const updatedUser = await authService.getProfile();
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    pageAccesses,
    login,
    logout,
    hasRole,
    hasPermission,
    isAdmin,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
