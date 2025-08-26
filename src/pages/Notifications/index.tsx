import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, Trash2, Eye } from 'lucide-react';

const Notifications = () => {
  // Mock notification data
  const notifications = [
    {
      id: 1,
      title: 'New Message',
      content: 'You have a new message from John Doe',
      timestamp: '10 minutes ago',
      type: 'message',
      isRead: false,
    },
    {
      id: 2,
      title: 'System Update',
      content: 'The system has been updated to version 2.1.0',
      timestamp: '1 hour ago',
      type: 'system',
      isRead: true,
    },
    {
      id: 3,
      title: 'Task Completed',
      content: 'Your task "Update documentation" has been completed',
      timestamp: '2 hours ago',
      type: 'task',
      isRead: false,
    },
    {
      id: 4,
      title: 'New User Registered',
      content: 'A new user has registered: Jane Smith',
      timestamp: '1 day ago',
      type: 'user',
      isRead: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: number) => {
    console.log(`Marking notification ${id} as read`);
  };

  const deleteNotification = (id: number) => {
    console.log(`Deleting notification ${id}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{unreadCount} unread</Badge>
            <Button variant="outline" size="sm">
              <Bell className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-4 ${!notification.isRead ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.isRead && (
                          <Badge variant="default" className="h-2 w-2 p-0">
                            <span className="sr-only">Unread</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any notifications yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
