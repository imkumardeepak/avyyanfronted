import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import type { UserDto, LoginDto, PageAccessDto } from '@/types/auth';

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: PageAccessDto[];
  login: (credentials: LoginDto) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (pageUrl: string, permission?: string) => boolean;
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
  const [permissions, setPermissions] = useState<PageAccessDto[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = authService.getUser();
        const savedToken = authService.getToken();

        if (savedUser && savedToken) {
          setUser(savedUser);
          setToken(savedToken);

          // Load user permissions
          try {
            const userPermissions = await authService.getPermissions();
            setPermissions(userPermissions);
          } catch (error) {
            console.error('Error loading permissions:', error);
          }
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
      setPermissions(response.pageAccesses);

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
      setPermissions([]);
      setIsLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const hasPermission = (pageUrl: string, permission: string = 'View'): boolean => {
    return permissions.some(
      (p) =>
        p.pageUrl === pageUrl &&
        (permission === 'View'
          ? p.canView
          : permission === 'Create'
            ? p.canCreate
            : permission === 'Edit'
              ? p.canEdit
              : permission === 'Delete'
                ? p.canDelete
                : permission === 'Export'
                  ? p.canExport
                  : false)
    );
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
    permissions,
    login,
    logout,
    hasRole,
    hasPermission,
    isAdmin,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
