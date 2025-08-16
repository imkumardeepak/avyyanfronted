import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const SystemStatus = () => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);

  useEffect(() => {
    const runSystemChecks = () => {
      const systemChecks: SystemCheck[] = [];

      // Check environment variables
      const apiUrl = import.meta.env.VITE_API_URL;
      systemChecks.push({
        name: 'API URL',
        status: apiUrl ? 'success' : 'error',
        message: apiUrl || 'Not configured',
      });

      // Check localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        systemChecks.push({
          name: 'Local Storage',
          status: 'success',
          message: 'Available',
        });
      } catch {
        systemChecks.push({
          name: 'Local Storage',
          status: 'error',
          message: 'Not available',
        });
      }

      // Check if running in development
      systemChecks.push({
        name: 'Environment',
        status: import.meta.env.DEV ? 'warning' : 'success',
        message: import.meta.env.DEV ? 'Development' : 'Production',
      });

      // Check browser features
      const hasNotifications = 'Notification' in window;
      systemChecks.push({
        name: 'Browser Notifications',
        status: hasNotifications ? 'success' : 'warning',
        message: hasNotifications ? 'Supported' : 'Not supported',
      });

      setChecks(systemChecks);
    };

    runSystemChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(check.status)}
              <span className="text-sm font-medium">{check.name}</span>
            </div>
            <Badge variant={getStatusVariant(check.status) as any}>
              {check.message}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
