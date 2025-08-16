import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/useUsers';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  User,
  Lock,
  Unlock,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { UserDto } from '@/types/auth';

const UserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { getUser, lockUser, unlockUser, deleteUser } = useUsers();
  
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const userData = await getUser(parseInt(id));
        setUser(userData);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load user details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id, getUser, toast]);

  const handleLockUser = async () => {
    if (!user) return;
    
    try {
      setActionLoading('lock');
      const success = await lockUser(user.id);
      if (success) {
        setUser({ ...user, isLocked: true });
        toast({
          title: 'Success',
          description: 'User has been locked',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to lock user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlockUser = async () => {
    if (!user) return;
    
    try {
      setActionLoading('unlock');
      const success = await unlockUser(user.id);
      if (success) {
        setUser({ ...user, isLocked: false });
        toast({
          title: 'Success',
          description: 'User has been unlocked',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unlock user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading('delete');
      const success = await deleteUser(user.id);
      if (success) {
        toast({
          title: 'Success',
          description: 'User has been deleted',
        });
        navigate('/users');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
          <Button onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/users/${user.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            {user.isLocked ? (
              <Button
                variant="outline"
                onClick={handleUnlockUser}
                disabled={actionLoading === 'unlock'}
              >
                {actionLoading === 'unlock' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Unlock
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleLockUser}
                disabled={actionLoading === 'lock'}
              >
                {actionLoading === 'lock' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Lock
              </Button>
            )}
            
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="text-lg">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.fullName}</h3>
                <p className="text-muted-foreground">@{user.username}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user.isOnline ? (
                    <Badge variant="default" className="text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <UserX className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                  {user.isLocked && (
                    <Badge variant="destructive" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                <p className="text-sm">{user.email}</p>
                {user.isEmailVerified && (
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>

              {user.phoneNumber && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </Label>
                  <p className="text-sm">{user.phoneNumber}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created
                </Label>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>

              {user.lastLoginAt && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <Clock className="h-4 w-4 mr-2" />
                    Last Login
                  </Label>
                  <p className="text-sm">{formatRelativeTime(user.lastLoginAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>
              User roles and access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline" className="mr-2">
                  {role}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper Label component
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm font-medium ${className}`}>{children}</div>
);

export default UserDetails;
