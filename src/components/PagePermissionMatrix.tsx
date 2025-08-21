import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Users,
  Folder,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MainNavItem,
  SubNavItem,
  PagePermissions,
  NavigationPermissionMatrix,
  PagePermissionRecord,
} from '@/types/navigation';

interface PagePermissionMatrixProps {
  permissions: NavigationPermissionMatrix;
  onPermissionChange: (pageName: string, permission: keyof PagePermissions, value: boolean) => void;
  onBulkPermissionChange: (
    pageNames: string[],
    permission: keyof PagePermissions,
    value: boolean
  ) => void;
  isLoading?: boolean;
}

const getIconComponent = (icon: React.ComponentType<{ className?: string }>) => {
  return icon || Shield;
};

export const PagePermissionMatrix: React.FC<PagePermissionMatrixProps> = ({
  permissions,
  onPermissionChange,
  onBulkPermissionChange,
  isLoading = false,
}) => {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const toggleParentExpansion = (parentPath: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentPath)) {
      newExpanded.delete(parentPath);
    } else {
      newExpanded.add(parentPath);
    }
    setExpandedParents(newExpanded);
  };

  const handlePermissionChange = (
    pageName: string,
    permission: keyof PagePermissions,
    checked: boolean
  ) => {
    onPermissionChange(pageName, permission, checked);
  };

  const handleParentPermissionChange = (
    parentPath: string,
    permission: keyof PagePermissions,
    checked: boolean
  ) => {
    const parentData = permissions[parentPath];
    if (!parentData || !parentData.children) return;

    // Apply to all children
    const childPageNames = parentData.children;
    onBulkPermissionChange(childPageNames, permission, checked);
  };

  const isParentPermissionChecked = (
    parentPath: string,
    permission: keyof PagePermissions
  ): boolean => {
    const parentData = permissions[parentPath];
    if (!parentData || !parentData.children) return false;

    return parentData.children.every((childPath) => {
      const childData = permissions[childPath];
      return childData?.permissions[permission] || false;
    });
  };

  const isParentPermissionIndeterminate = (
    parentPath: string,
    permission: keyof PagePermissions
  ): boolean => {
    const parentData = permissions[parentPath];
    if (!parentData || !parentData.children) return false;

    const checkedChildren = parentData.children.filter((childPath) => {
      const childData = permissions[childPath];
      return childData?.permissions[permission] || false;
    });

    return checkedChildren.length > 0 && checkedChildren.length < parentData.children.length;
  };

  const renderPermissionCheckboxes = (
    pageName: string,
    pagePermissions: PagePermissions,
    isChild = false
  ) => {
    const permissionTypes: Array<{ key: keyof PagePermissions; label: string; color: string }> = [
      { key: 'canRead', label: 'Read', color: 'text-blue-600' },
      { key: 'canCreate', label: 'Create', color: 'text-green-600' },
      { key: 'canEdit', label: 'Edit', color: 'text-yellow-600' },
      { key: 'canDelete', label: 'Delete', color: 'text-red-600' },
    ];

    return (
      <div className={cn('grid grid-cols-4 gap-4', isChild && 'ml-6')}>
        {permissionTypes.map(({ key, label, color }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`${pageName}-${key}`}
              checked={pagePermissions[key]}
              onCheckedChange={(checked) =>
                handlePermissionChange(pageName, key, checked as boolean)
              }
              disabled={isLoading}
            />
            <label
              htmlFor={`${pageName}-${key}`}
              className={cn('text-sm font-medium cursor-pointer', color)}
            >
              {label}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderParentPermissionCheckboxes = (parentPath: string) => {
    const permissionTypes: Array<{ key: keyof PagePermissions; label: string; color: string }> = [
      { key: 'canRead', label: 'All Read', color: 'text-blue-600' },
      { key: 'canCreate', label: 'All Create', color: 'text-green-600' },
      { key: 'canEdit', label: 'All Edit', color: 'text-yellow-600' },
      { key: 'canDelete', label: 'All Delete', color: 'text-red-600' },
    ];

    return (
      <div className="grid grid-cols-4 gap-4">
        {permissionTypes.map(({ key, label, color }) => {
          const isChecked = isParentPermissionChecked(parentPath, key);
          const isIndeterminate = isParentPermissionIndeterminate(parentPath, key);

          return (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`${parentPath}-${key}`}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleParentPermissionChange(parentPath, key, checked as boolean)
                }
                disabled={isLoading}
                className={isIndeterminate ? 'data-[state=checked]:bg-orange-500' : ''}
              />
              <label
                htmlFor={`${parentPath}-${key}`}
                className={cn('text-sm font-medium cursor-pointer', color)}
              >
                {label}
              </label>
            </div>
          );
        })}
      </div>
    );
  };

  // Group permissions by parent/child structure
  const parentItems: string[] = [];
  const childItems: { [parentPath: string]: string[] } = {};
  const standaloneItems: string[] = [];

  Object.entries(permissions).forEach(([pageName, data]) => {
    if (data.isParent && data.children) {
      parentItems.push(pageName);
      childItems[pageName] = data.children;
    } else {
      // Check if this is a child of a parent
      const parentPath = Object.keys(childItems).find((parent) =>
        childItems[parent].includes(pageName)
      );

      if (!parentPath) {
        standaloneItems.push(pageName);
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Page Permissions</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which pages this role can access and what actions they can perform on each page.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Standalone Items */}
        {standaloneItems.map((pageName) => {
          const data = permissions[pageName];
          if (!data) return null;

          const IconComponent = getIconComponent(data.item.icon);

          return (
            <div key={pageName} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{data.item.title}</h4>
                    {data.item.description && (
                      <p className="text-sm text-muted-foreground">{data.item.description}</p>
                    )}
                  </div>
                </div>
              </div>
              {renderPermissionCheckboxes(pageName, data.permissions)}
              <Separator />
            </div>
          );
        })}

        {/* Parent Items with Children */}
        {parentItems.map((parentPath) => {
          const parentData = permissions[parentPath];
          if (!parentData) return null;

          const isExpanded = expandedParents.has(parentPath);
          const IconComponent = getIconComponent(parentData.item.icon);

          return (
            <div key={parentPath} className="space-y-3">
              {/* Parent Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParentExpansion(parentPath)}
                    className="p-1 h-auto"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <IconComponent className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{parentData.item.title}</h4>
                    {parentData.item.description && (
                      <p className="text-sm text-muted-foreground">{parentData.item.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">{parentData.children?.length || 0} pages</Badge>
                </div>
              </div>

              {/* Parent Bulk Actions */}
              <div className="ml-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">Bulk Actions:</p>
                {renderParentPermissionCheckboxes(parentPath)}
              </div>

              {/* Children */}
              {isExpanded && parentData.children && (
                <div className="ml-8 space-y-4">
                  {parentData.children.map((childPath) => {
                    const childData = permissions[childPath];
                    if (!childData) return null;

                    const ChildIconComponent = getIconComponent(childData.item.icon);

                    return (
                      <div key={childPath} className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <ChildIconComponent className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <h5 className="text-sm font-medium">{childData.item.title}</h5>
                            {childData.item.description && (
                              <p className="text-xs text-muted-foreground">
                                {childData.item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {renderPermissionCheckboxes(childPath, childData.permissions, true)}
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
