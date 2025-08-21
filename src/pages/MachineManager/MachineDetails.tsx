import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Settings,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import type { MachineManagerDto } from '@/types/machine';
import { formatDate } from '@/lib/utils';

const MachineDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getMachine, deleteMachine, loading, error } = useMachines();
  const [machine, setMachine] = useState<MachineManagerDto | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadMachine(parseInt(id));
    }
  }, [id]);

  const loadMachine = async (machineId: number) => {
    try {
      const machineData = await getMachine(machineId);
      setMachine(machineData);
    } catch (err) {
      console.error('Failed to load machine:', err);
    }
  };

  const handleDelete = () => {
    if (!machine) return;
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!machine) return;
    try {
      await deleteMachine(machine.id);
      navigate('/machines');
    } catch (err) {
      console.error('Failed to delete machine:', err);
    }
    setDeleteDialog(false);
  };

  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 80)
      return { label: 'Excellent', variant: 'default' as const, icon: CheckCircle };
    if (efficiency >= 60) return { label: 'Good', variant: 'secondary' as const, icon: Clock };
    return { label: 'Needs Attention', variant: 'destructive' as const, icon: AlertTriangle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/machines')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Error loading machine details: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/machines')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Machine not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const efficiencyStatus = getEfficiencyStatus(machine.efficiency);
  const EfficiencyIcon = efficiencyStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/machines')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">{machine.machineName}</h1>
            <p className="text-muted-foreground">Machine Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/machines/${machine.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={machine.isActive ? 'default' : 'secondary'}>
              {machine.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <EfficiencyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{machine.efficiency}%</div>
              <Badge variant={efficiencyStatus.variant}>{efficiencyStatus.label}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {machine.updatedAt ? formatDate(machine.updatedAt) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Technical Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Dia</Label>
                <div className="text-lg font-semibold">{machine.dia}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">GG</Label>
                <div className="text-lg font-semibold">{machine.gg}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Needle Count</Label>
                <div className="text-lg font-semibold">{machine.needle}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Feeder Count</Label>
                <div className="text-lg font-semibold">{machine.feeder}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">RPM</Label>
                <div className="text-lg font-semibold">{machine.rpm}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Slit</Label>
                <div className="text-lg font-semibold">{machine.slit}</div>
              </div>
            </div>

            {machine.constat && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Constat</Label>
                  <div className="text-lg font-semibold">{machine.constat}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {machine.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <div className="mt-1 text-sm">{machine.description}</div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                <div className="text-sm">{formatDate(machine.createdAt)}</div>
              </div>
              {machine.updatedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <div className="text-sm">{formatDate(machine.updatedAt)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Efficiency Rating</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${machine.efficiency}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{machine.efficiency}%</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {machine.efficiency >= 80 &&
                'This machine is performing excellently with high efficiency.'}
              {machine.efficiency >= 60 &&
                machine.efficiency < 80 &&
                'This machine is performing well but has room for improvement.'}
              {machine.efficiency < 60 &&
                'This machine may need maintenance or optimization to improve efficiency.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        itemName={machine ? machine.machineName : ''}
        itemType="Machine"
        onConfirm={confirmDelete}
        isLoading={loading}
        additionalInfo="All production data, maintenance records, and performance history will be permanently removed."
      />
    </div>
  );
};

// Helper component for labels
const Label = ({ className, children, ...props }: any) => (
  <label className={`text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export default MachineDetails;
