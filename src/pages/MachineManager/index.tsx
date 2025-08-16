import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import type { MachineManagerDto } from '@/types/machine';
import type { Row } from '@tanstack/react-table';

type CellProps = { row: Row<MachineManagerDto> };

const MachineManager = () => {
  const navigate = useNavigate();
  const { machines, loading, error, searchMachines, deleteMachine } = useMachines();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMachines, setFilteredMachines] = useState<MachineManagerDto[]>([]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = machines.filter(
        (machine) =>
          machine.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMachines(filtered);
    } else {
      setFilteredMachines(machines);
    }
  }, [machines, searchTerm]);

  const columns = [
    {
      accessorKey: 'machineName',
      header: 'Machine Name',
      cell: ({ row }: { row: Row<MachineManagerDto> }) => (
        <div className="font-medium">{row.getValue('machineName')}</div>
      ),
    },
    {
      accessorKey: 'dia',
      header: 'Dia',
      cell: ({ row }: CellProps) => <div className="text-center">{row.getValue('dia')}</div>,
    },
    {
      accessorKey: 'gg',
      header: 'GG',
      cell: ({ row }: CellProps) => <div className="text-center">{row.getValue('gg')}</div>,
    },
    {
      accessorKey: 'needle',
      header: 'Needle',
      cell: ({ row }: CellProps) => <div className="text-center">{row.getValue('needle')}</div>,
    },
    {
      accessorKey: 'feeder',
      header: 'Feeder',
      cell: ({ row }: CellProps) => <div className="text-center">{row.getValue('feeder')}</div>,
    },
    {
      accessorKey: 'rpm',
      header: 'RPM',
      cell: ({ row }: CellProps) => <div className="text-center">{row.getValue('rpm')}</div>,
    },
    {
      accessorKey: 'efficiency',
      header: 'Efficiency',
      cell: ({ row }: CellProps) => {
        const efficiency = row.getValue('efficiency') as number;
        return (
          <Badge
            variant={efficiency >= 80 ? 'default' : efficiency >= 60 ? 'secondary' : 'destructive'}
          >
            {efficiency}%
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: CellProps) => (
        <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: CellProps) => {
        const machine = row.original;
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/machines/${machine.id}`)}>
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/machines/${machine.id}/edit`)}
            >
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(machine.id)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      await deleteMachine(id);
    }
  };

  const handleSearch = async () => {
    if (searchTerm) {
      await searchMachines({ machineName: searchTerm });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">Error loading machines: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Machine Manager</h1>
          <p className="text-muted-foreground">
            Manage your knitting machines and their configurations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/machines/import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/machines/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Machine
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search machines by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machines.filter((m) => m.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {machines.filter((m) => m.efficiency >= 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {machines.length > 0
                ? Math.round(machines.reduce((sum, m) => sum + m.efficiency, 0) / machines.length)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Machines ({filteredMachines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredMachines} searchKey="machineName" />
        </CardContent>
      </Card>
    </div>
  );
};

export default MachineManager;
