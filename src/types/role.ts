// Role Management Types
export interface RoleDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionDto[];
  userCount?: number; // Number of users assigned to this role
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  isActive: boolean;
  permissionIds: number[];
}

export interface UpdateRoleDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  permissionIds: number[];
}

// Permission Types
export interface PermissionDto {
  id: number;
  name: string;
  description?: string;
  category: PermissionCategory;
  resource: string; // e.g., 'users', 'machines', 'notifications'
  action: PermissionAction; // e.g., 'read', 'write', 'delete'
  isActive: boolean;
}

export interface PermissionGroupDto {
  category: PermissionCategory;
  permissions: PermissionDto[];
}

export enum PermissionCategory {
  DASHBOARD = 'Dashboard',
  USER_MANAGEMENT = 'User Management',
  MACHINE_MANAGEMENT = 'Machine Management',
  ROLE_MANAGEMENT = 'Role Management',
  NOTIFICATIONS = 'Notifications',
  REPORTS = 'Reports',
  SETTINGS = 'Settings',
  CHAT = 'Chat',
  SYSTEM = 'System'
}

export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE = 'manage'
}

// Role Assignment Types
export interface RoleAssignmentDto {
  id: number;
  userId: number;
  roleId: number;
  assignedAt: string;
  assignedBy: number;
}

// API Response Types
export interface RoleListResponse {
  roles: RoleDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PermissionListResponse {
  permissions: PermissionDto[];
  total: number;
}

// Form Types
export interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
  permissions: {
    [category: string]: {
      [permissionId: string]: boolean;
    };
  };
}

// Permission Check Types
export interface UserPermissions {
  [resource: string]: {
    [action: string]: boolean;
  };
}

// Default Permissions Configuration
export const DEFAULT_PERMISSIONS: Omit<PermissionDto, 'id' | 'isActive'>[] = [
  // Dashboard
  { name: 'View Dashboard', description: 'Access to main dashboard', category: PermissionCategory.DASHBOARD, resource: 'dashboard', action: PermissionAction.READ },
  
  // User Management
  { name: 'View Users', description: 'View user list and details', category: PermissionCategory.USER_MANAGEMENT, resource: 'users', action: PermissionAction.READ },
  { name: 'Create Users', description: 'Create new user accounts', category: PermissionCategory.USER_MANAGEMENT, resource: 'users', action: PermissionAction.WRITE },
  { name: 'Edit Users', description: 'Edit existing user accounts', category: PermissionCategory.USER_MANAGEMENT, resource: 'users', action: PermissionAction.WRITE },
  { name: 'Delete Users', description: 'Delete user accounts', category: PermissionCategory.USER_MANAGEMENT, resource: 'users', action: PermissionAction.DELETE },
  { name: 'Manage Users', description: 'Full user management access', category: PermissionCategory.USER_MANAGEMENT, resource: 'users', action: PermissionAction.MANAGE },
  
  // Machine Management
  { name: 'View Machines', description: 'View machine list and details', category: PermissionCategory.MACHINE_MANAGEMENT, resource: 'machines', action: PermissionAction.READ },
  { name: 'Create Machines', description: 'Add new machines', category: PermissionCategory.MACHINE_MANAGEMENT, resource: 'machines', action: PermissionAction.WRITE },
  { name: 'Edit Machines', description: 'Edit machine details', category: PermissionCategory.MACHINE_MANAGEMENT, resource: 'machines', action: PermissionAction.WRITE },
  { name: 'Delete Machines', description: 'Delete machines', category: PermissionCategory.MACHINE_MANAGEMENT, resource: 'machines', action: PermissionAction.DELETE },
  { name: 'Manage Machines', description: 'Full machine management access', category: PermissionCategory.MACHINE_MANAGEMENT, resource: 'machines', action: PermissionAction.MANAGE },
  
  // Role Management
  { name: 'View Roles', description: 'View role list and details', category: PermissionCategory.ROLE_MANAGEMENT, resource: 'roles', action: PermissionAction.READ },
  { name: 'Create Roles', description: 'Create new roles', category: PermissionCategory.ROLE_MANAGEMENT, resource: 'roles', action: PermissionAction.WRITE },
  { name: 'Edit Roles', description: 'Edit existing roles', category: PermissionCategory.ROLE_MANAGEMENT, resource: 'roles', action: PermissionAction.WRITE },
  { name: 'Delete Roles', description: 'Delete roles', category: PermissionCategory.ROLE_MANAGEMENT, resource: 'roles', action: PermissionAction.DELETE },
  { name: 'Manage Roles', description: 'Full role management access', category: PermissionCategory.ROLE_MANAGEMENT, resource: 'roles', action: PermissionAction.MANAGE },
  
  // Notifications
  { name: 'View Notifications', description: 'View notifications', category: PermissionCategory.NOTIFICATIONS, resource: 'notifications', action: PermissionAction.READ },
  { name: 'Create Notifications', description: 'Create system notifications', category: PermissionCategory.NOTIFICATIONS, resource: 'notifications', action: PermissionAction.WRITE },
  { name: 'Delete Notifications', description: 'Delete notifications', category: PermissionCategory.NOTIFICATIONS, resource: 'notifications', action: PermissionAction.DELETE },
  
  // Chat
  { name: 'View Chat', description: 'Access chat system', category: PermissionCategory.CHAT, resource: 'chat', action: PermissionAction.READ },
  { name: 'Send Messages', description: 'Send chat messages', category: PermissionCategory.CHAT, resource: 'chat', action: PermissionAction.WRITE },
  { name: 'Manage Chat', description: 'Manage chat rooms and messages', category: PermissionCategory.CHAT, resource: 'chat', action: PermissionAction.MANAGE },
  
  // Reports
  { name: 'View Reports', description: 'Access reports and analytics', category: PermissionCategory.REPORTS, resource: 'reports', action: PermissionAction.READ },
  { name: 'Generate Reports', description: 'Generate custom reports', category: PermissionCategory.REPORTS, resource: 'reports', action: PermissionAction.WRITE },
  
  // Settings
  { name: 'View Settings', description: 'View system settings', category: PermissionCategory.SETTINGS, resource: 'settings', action: PermissionAction.READ },
  { name: 'Manage Settings', description: 'Modify system settings', category: PermissionCategory.SETTINGS, resource: 'settings', action: PermissionAction.MANAGE },
  
  // System
  { name: 'System Admin', description: 'Full system administration access', category: PermissionCategory.SYSTEM, resource: 'system', action: PermissionAction.MANAGE },
];

// Helper Functions
export const groupPermissionsByCategory = (permissions: PermissionDto[]): PermissionGroupDto[] => {
  const grouped = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<PermissionCategory, PermissionDto[]>);

  return Object.entries(grouped).map(([category, permissions]) => ({
    category: category as PermissionCategory,
    permissions: permissions.sort((a, b) => a.name.localeCompare(b.name))
  }));
};

export const hasPermission = (userPermissions: UserPermissions, resource: string, action: string): boolean => {
  return userPermissions[resource]?.[action] === true;
};

export const canAccessPage = (userPermissions: UserPermissions, page: string): boolean => {
  switch (page) {
    case '/dashboard':
      return hasPermission(userPermissions, 'dashboard', 'read');
    case '/users':
      return hasPermission(userPermissions, 'users', 'read');
    case '/machines':
      return hasPermission(userPermissions, 'machines', 'read');
    case '/roles':
      return hasPermission(userPermissions, 'roles', 'read');
    case '/notifications':
      return hasPermission(userPermissions, 'notifications', 'read');
    case '/chat':
      return hasPermission(userPermissions, 'chat', 'read');
    case '/reports':
      return hasPermission(userPermissions, 'reports', 'read');
    case '/settings':
      return hasPermission(userPermissions, 'settings', 'read');
    default:
      return false;
  }
};
