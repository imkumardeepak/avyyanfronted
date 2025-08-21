import React from 'react';
import {
  BarChart3,
  Folder,
  Cog,
  Users,
  Shield,
  MessageSquare,
  Bell,
  User,
  Settings,
} from 'lucide-react';

// Page-level permission types
export interface PagePermissions {
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Database storage format for permissions
export interface PagePermissionRecord {
  pageName: string; // The route path (href) used as unique identifier
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Permission requirement for navigation items
export interface NavigationPermissionRequirement {
  pageName: string; // The route path that maps to database permissions
  requiredActions: ('read' | 'create' | 'edit' | 'delete')[]; // Which actions are needed to show this menu item
}

// Base navigation item interface
export interface BaseNavItem {
  title: string;
  href: string; // This will be used as the pageName identifier in database
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string; // Optional description for permission management UI
  // Permission requirements - optional for items that don't need specific permissions
  permissionRequirement?: NavigationPermissionRequirement;
  // Alternative: allow public access (overrides permission check)
  isPublic?: boolean;
}

// Sub-menu item interface (leaf nodes)
export interface SubNavItem extends BaseNavItem {
  // Sub-menu items are always leaf nodes (no children)
  parentPath?: string; // Reference to parent menu for hierarchical display
}

// Main menu item interface (can have children)
export interface MainNavItem extends BaseNavItem {
  children?: SubNavItem[];
  // For parent menus, we can specify if they need any permissions themselves
  isParentOnly?: boolean; // True if this is just a grouping menu with no direct functionality
}

// Navigation structure for the entire application
export interface NavigationStructure {
  mainNavItems: MainNavItem[];
  bottomNavItems: MainNavItem[];
}

// Permission matrix for role management forms
export interface NavigationPermissionMatrix {
  [pageName: string]: {
    item: MainNavItem | SubNavItem;
    permissions: PagePermissions;
    isParent: boolean;
    children?: string[]; // Page names of children for parent items
  };
}

// Role permission data structure for API
export interface RolePagePermissions {
  roleId: number;
  pagePermissions: PagePermissionRecord[];
}

// Form data structure for role management
export interface RolePermissionFormData {
  roleId?: number;
  roleName: string;
  roleDescription?: string;
  isActive: boolean;
  pagePermissions: {
    [pageName: string]: PagePermissions;
  };
}

// Navigation configuration with all available pages
export const NAVIGATION_CONFIG: NavigationStructure = {
  mainNavItems: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      description: 'Main dashboard with overview and analytics',
      permissionRequirement: {
        pageName: '/dashboard',
        requiredActions: ['read'],
      },
    },
    {
      title: 'Master',
      href: '#master',
      icon: Folder,
      description: 'Master data management',
      isParentOnly: true,
      children: [
        {
          title: 'Machine Manager',
          href: '/machines',
          icon: Cog,
          description: 'Manage manufacturing machines and equipment',
          parentPath: '#master',
          permissionRequirement: {
            pageName: '/machines',
            requiredActions: ['read'],
          },
        },
      ],
    },
    {
      title: 'User Management',
      href: '#user-management',
      icon: Users,
      description: 'User and role management',
      isParentOnly: true,
      children: [
        {
          title: 'Role Management',
          href: '/roles',
          icon: Shield,
          description: 'Manage user roles and permissions',
          parentPath: '#user-management',
          permissionRequirement: {
            pageName: '/roles',
            requiredActions: ['read'],
          },
        },
        {
          title: 'Users',
          href: '/users',
          icon: Users,
          description: 'Manage user accounts and profiles',
          parentPath: '#user-management',
          permissionRequirement: {
            pageName: '/users',
            requiredActions: ['read'],
          },
        },
      ],
    },
    {
      title: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'Internal communication and messaging',
      permissionRequirement: {
        pageName: '/chat',
        requiredActions: ['read'],
      },
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: Bell,
      description: 'System notifications and alerts',
      permissionRequirement: {
        pageName: '/notifications',
        requiredActions: ['read'],
      },
    },
  ],
  bottomNavItems: [
    {
      title: 'Profile',
      href: '/profile',
      icon: User,
      description: 'User profile and account settings',
      isPublic: true, // Profile is accessible to all authenticated users
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'System configuration and preferences',
      permissionRequirement: {
        pageName: '/settings',
        requiredActions: ['read'],
      },
    },
  ],
};

// Helper functions for navigation and permission management
export const getAllNavigationItems = (): (MainNavItem | SubNavItem)[] => {
  const allItems: (MainNavItem | SubNavItem)[] = [];
  
  // Add main navigation items
  NAVIGATION_CONFIG.mainNavItems.forEach(item => {
    allItems.push(item);
    if (item.children) {
      allItems.push(...item.children);
    }
  });
  
  // Add bottom navigation items
  NAVIGATION_CONFIG.bottomNavItems.forEach(item => {
    allItems.push(item);
    if (item.children) {
      allItems.push(...item.children);
    }
  });
  
  return allItems;
};

export const getNavigationItemByPath = (path: string): MainNavItem | SubNavItem | undefined => {
  const allItems = getAllNavigationItems();
  return allItems.find(item => item.href === path);
};

export const getParentNavigationItems = (): MainNavItem[] => {
  return [
    ...NAVIGATION_CONFIG.mainNavItems.filter(item => item.children && item.children.length > 0),
    ...NAVIGATION_CONFIG.bottomNavItems.filter(item => item.children && item.children.length > 0),
  ];
};

export const getLeafNavigationItems = (): (MainNavItem | SubNavItem)[] => {
  const leafItems: (MainNavItem | SubNavItem)[] = [];
  
  // Add main navigation items without children
  NAVIGATION_CONFIG.mainNavItems.forEach(item => {
    if (!item.children || item.children.length === 0) {
      leafItems.push(item);
    } else {
      // Add children
      leafItems.push(...item.children);
    }
  });
  
  // Add bottom navigation items without children
  NAVIGATION_CONFIG.bottomNavItems.forEach(item => {
    if (!item.children || item.children.length === 0) {
      leafItems.push(item);
    } else {
      // Add children
      leafItems.push(...item.children);
    }
  });
  
  return leafItems;
};

export const createNavigationPermissionMatrix = (
  pagePermissions: PagePermissionRecord[] = []
): NavigationPermissionMatrix => {
  const matrix: NavigationPermissionMatrix = {};
  const allItems = getAllNavigationItems();
  
  allItems.forEach(item => {
    const existingPermission = pagePermissions.find(p => p.pageName === item.href);
    const isParent = 'children' in item && item.children && item.children.length > 0;
    
    matrix[item.href] = {
      item,
      permissions: {
        canRead: existingPermission?.canRead || false,
        canCreate: existingPermission?.canCreate || false,
        canEdit: existingPermission?.canEdit || false,
        canDelete: existingPermission?.canDelete || false,
      },
      isParent: !!isParent,
      children: isParent ? (item as MainNavItem).children?.map(child => child.href) : undefined,
    };
  });
  
  return matrix;
};

export const convertMatrixToPagePermissions = (
  matrix: NavigationPermissionMatrix
): PagePermissionRecord[] => {
  return Object.entries(matrix)
    .filter(([_, data]) => !data.isParent) // Only include leaf items, not parent groupings
    .map(([pageName, data]) => ({
      pageName,
      canRead: data.permissions.canRead,
      canCreate: data.permissions.canCreate,
      canEdit: data.permissions.canEdit,
      canDelete: data.permissions.canDelete,
    }));
};

// Permission checking utilities
export const hasPagePermission = (
  userPermissions: PagePermissionRecord[],
  pageName: string,
  action: 'read' | 'create' | 'edit' | 'delete'
): boolean => {
  const pagePermission = userPermissions.find(p => p.pageName === pageName);
  if (!pagePermission) return false;
  
  switch (action) {
    case 'read':
      return pagePermission.canRead;
    case 'create':
      return pagePermission.canCreate;
    case 'edit':
      return pagePermission.canEdit;
    case 'delete':
      return pagePermission.canDelete;
    default:
      return false;
  }
};

export const canAccessNavigationItem = (
  userPermissions: PagePermissionRecord[],
  item: MainNavItem | SubNavItem
): boolean => {
  // Public items are always accessible
  if (item.isPublic) return true;
  
  // Items without permission requirements are accessible (backward compatibility)
  if (!item.permissionRequirement) return true;
  
  // Check if user has any of the required actions for this page
  return item.permissionRequirement.requiredActions.some(action =>
    hasPagePermission(userPermissions, item.permissionRequirement!.pageName, action)
  );
};
