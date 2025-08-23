import React, { useState, type JSX } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, ChevronLeft, ChevronRight, Cog, Users, BarChart3, Shield } from 'lucide-react';

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

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, pageAccesses } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const hasAccess = (href: string) => {
    const page = pageAccesses.find((p) => href.toLowerCase().includes(p.pageName.toLowerCase()));
    console.log(pageAccesses.map((p) => p.pageName));
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
