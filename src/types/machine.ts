export interface MachineManagerDto {
  id: number;
  machineName: string;
  dia: number;
  gg: number;
  needle: number;
  feeder: number;
  rpm: number;
  constat: number;
  efficiency: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateMachineManagerDto {
  machineName: string;
  dia: number;
  gg: number;
  needle: number;
  feeder: number;
  rpm: number;
  constat: number;
  efficiency: number;
  description: string;
}

export interface UpdateMachineManagerDto {
  machineName: string;
  dia: number;
  gg: number;
  needle: number;
  feeder: number;
  rpm: number;
  constat: number;
  efficiency: number;
  description: string;
  isActive: boolean;
}

export interface MachineSearchDto {
  machineName?: string;
  dia?: number;
}

export interface MachineStatsDto {
  totalMachines: number;
  activeMachines: number;
  averageEfficiency: number;
  highEfficiencyCount: number;
  lowEfficiencyCount: number;
  maintenanceDueCount: number;
}

export interface MachineEfficiencyRange {
  min: number;
  max: number;
}

export interface BulkMachineUpdateDto {
  machineIds: number[];
  isActive?: boolean;
  efficiency?: number;
}

export interface MachineMaintenanceDto {
  machineId: number;
  scheduledDate: string;
  maintenanceType: string;
  notes?: string;
}