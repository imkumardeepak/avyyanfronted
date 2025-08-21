import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useSidebar } from '@/contexts/SidebarContext'; // Import useSidebar
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  Folder,
  ChevronLeft,
  ChevronRight,
  Cog,
  Users,
  MessageSquare,
  Bell,
  BarChart3,
  Shield,
} from 'lucide-react';
import type { MainNavItem, SubNavItem } from '@/types/navigation';

const navItems: MainNavItem[] = [
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
];

const bottomNavItems: MainNavItem[] = [
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
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { isSidebarCollapsed, toggleSidebar } = useSidebar(); // Use isSidebarCollapsed and toggleSidebar from context
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  // Permission checking functions
  const hasItemPermission = (item: MainNavItem | SubNavItem): boolean => {
    // If item is marked as public, allow access
    if (item.isPublic) {
      return true;
    }

    // If no permission requirement specified, allow access (backward compatibility)
    if (!item.permissionRequirement) {
      return true;
    }

    // Check if user has any of the required permissions for this page
    // For now, we'll use the old permission system until we implement the new page-based system
    const pageName = item.permissionRequirement.pageName;
    const requiredActions = item.permissionRequirement.requiredActions;

    // Convert page name to resource name for backward compatibility
    let resource = 'dashboard';
    if (pageName.includes('/users')) resource = 'users';
    else if (pageName.includes('/roles')) resource = 'roles';
    else if (pageName.includes('/machines')) resource = 'machines';
    else if (pageName.includes('/chat')) resource = 'chat';
    else if (pageName.includes('/notifications')) resource = 'notifications';
    else if (pageName.includes('/settings')) resource = 'settings';

    // Check if user has any of the required actions
    return requiredActions.some((action) => hasPermission(resource, action));
  };

  const getAccessibleChildren = (children: SubNavItem[] | undefined): SubNavItem[] => {
    if (!children) return [];
    return children.filter((child) => hasItemPermission(child));
  };

  const shouldShowParentMenu = (item: MainNavItem): boolean => {
    // If item has no children, check its own permission
    if (!item.children || item.children.length === 0) {
      return hasItemPermission(item);
    }

    // If item has children, show parent only if at least one child is accessible
    const accessibleChildren = getAccessibleChildren(item.children);
    return accessibleChildren.length > 0;
  };

  const renderNavItem = (item: MainNavItem | SubNavItem, level = 0) => {
    // Check if user has permission to see this item
    if (!shouldShowParentMenu(item as MainNavItem)) {
      return null;
    }

    // Get accessible children for parent menus
    const accessibleChildren = getAccessibleChildren((item as MainNavItem).children);
    const hasChildren = accessibleChildren.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <NavLink
          to={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
            active && 'bg-accent text-accent-foreground',
            level > 0 && 'ml-6',
            isSidebarCollapsed && level === 0 && 'justify-center px-2'
          )}
          onClick={(e) => {
            if (hasChildren && !isSidebarCollapsed) {
              e.preventDefault();
              toggleExpanded(item.href);
            }
          }}
        >
          <item.icon className={cn('h-4 w-4', isSidebarCollapsed && 'h-5 w-5')} />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                <ChevronRight
                  className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
                />
              )}
            </>
          )}
        </NavLink>

        {hasChildren && isExpanded && !isSidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {accessibleChildren.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-300',
        isSidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!isSidebarCollapsed && (
          <h2 className="text-lg font-semibold text-foreground">Avyaan Knitfab</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar} // Use toggleSidebar from context
          className={cn('ml-auto h-8 w-8 p-0', isSidebarCollapsed && 'mx-auto')}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.filter((item) => shouldShowParentMenu(item)).map((item) => renderNavItem(item))}
        </nav>

        <nav className="space-y-1 px-3">
          {bottomNavItems
            .filter((item) => shouldShowParentMenu(item))
            .map((item) => renderNavItem(item))}
        </nav>
      </div>

      {/* Footer */}
      {!isSidebarCollapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {user?.firstName && user?.lastName
                  ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                  : user?.firstName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
