import React, { useState, useEffect, type JSX } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  ChevronLeft,
  ChevronRight,
  Cog,
  Users,
  BarChart3,
  Shield,
  MessageSquare,
  Bell,
  type LucideIcon,
} from 'lucide-react';

type Icon = LucideIcon;

interface NavItem {
  title: string;
  href: string;
  icon: Icon;
  description: string;
  isParentOnly?: boolean;
  children?: NavItem[];
  badge?: string;
}

const navConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Main dashboard with overview and analytics',
  },
  {
    title: 'Master',
    href: '#master',
    icon: Folder,
    description: 'Master data management',
    isParentOnly: true,
    children: [
      {
        title: 'Machine Master',
        href: '/machines',
        icon: Cog,
        description: 'Manage manufacturing machines and equipment',
      },
      {
        title: 'Fabric Structure',
        href: '/fabric-structures',
        icon: Cog,
        description: 'Manage fabric structure and components',
      },
      {
        title: 'Location Master',
        href: '/locations',
        icon: Cog,
        description: 'Manage manufacturing locations and facilities',
      },
      {
        title: 'Yarn Type',
        href: '/yarn-types',
        icon: Cog,
        description: 'Manage yarn types and codes',
      },
    ],
  },
  {
    title: 'Sales',
    href: '#sales',
    icon: BarChart3,
    description: 'Sales management',
    isParentOnly: true,
    children: [
      {
        title: 'Sales Orders',
        href: '/sales-orders',
        icon: BarChart3,
        description: 'Manage unprocessed sales orders',
      },
    ],
  },
  {
    title: 'Communication',
    href: '#communication',
    icon: MessageSquare,
    description: 'Chat and notifications',
    isParentOnly: true,
    children: [
      {
        title: 'Chat',
        href: '/chat',
        icon: MessageSquare,
        description: 'Real-time messaging and communication',
      },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
        description: 'View and manage notifications',
      },
    ],
  },
  {
    title: 'Administration',
    href: '#administration',
    icon: Shield,
    description: 'User and role administration',
    isParentOnly: true,
    children: [
      {
        title: 'Role Master',
        href: '/roles',
        icon: Shield,
        description: 'Manage user roles and permissions',
      },
      {
        title: 'User Management',
        href: '/users',
        icon: Users,
        description: 'Manage user accounts and profiles',
      },
    ],
  },
];

// Helper function to get expanded items from localStorage
const getExpandedItemsFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem('sidebar_expanded_items');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading expanded items from localStorage:', error);
    return [];
  }
};

// Helper function to save expanded items to localStorage
const saveExpandedItemsToStorage = (items: string[]): void => {
  try {
    localStorage.setItem('sidebar_expanded_items', JSON.stringify(items));
  } catch (error) {
    console.error('Error saving expanded items to localStorage:', error);
  }
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, pageAccesses } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => getExpandedItemsFromStorage());

  // Save expanded items to localStorage whenever they change
  useEffect(() => {
    saveExpandedItemsToStorage(expandedItems);
  }, [expandedItems]);

  const hasAccess = (pageTitle: string) => {
    const page = pageAccesses.find((p) => p.pageName.toLowerCase() === pageTitle.toLowerCase());
    return page?.isView ?? false;
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    return location.pathname.toLowerCase() === href.toLowerCase();
  };

  const renderNavItem = (item: NavItem, level = 0): JSX.Element | null => {
    const accessibleChildren = item.children?.filter((child) => hasAccess(child.title)) ?? [];
    const hasChildren = accessibleChildren.length > 0;

    if (!hasAccess(item.title) && !hasChildren) {
      return null;
    }

    if (item.isParentOnly && !hasChildren) {
      return null;
    }

    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <NavLink
          to={item.isParentOnly ? '#' : item.href}
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
          onClick={toggleSidebar}
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
        <nav className="space-y-1 px-3">{navConfig.map((item) => renderNavItem(item))}</nav>
      </div>

      {/* Footer */}
      {!isSidebarCollapsed && (
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Online</span>
          </div>
          <div className="mt-1 truncate">
            {user?.firstName} {user?.lastName}
          </div>
        </div>
      )}
    </div>
  );
};
