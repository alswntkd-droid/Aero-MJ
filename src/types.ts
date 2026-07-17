/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductionData {
  id: string;
  date: string;
  productCode: string;
  processName: string;
  equipmentId: string;
  plannedQty: number;
  inputQty: number;
  goodQty: number;
  defectQty: number;
  
  // Calculated fields
  achievementRate: number;
  yieldRate: number;
}

export interface DowntimeData {
  id: string;
  date: string;
  equipmentId: string;
  errorCode: string;
  reason: string;
  durationMinutes: number;
}

export interface CapaVariables {
  workingHours: number; // minutes per shift
  shiftCount: number;
  breakTime: number; // total break minutes
  oee: number; // 0 to 1
}

export interface ProcessCapa {
  processName: string;
  cycleTime: number; // seconds
  equipmentCount: number;
  effectiveCapa: number;
  achievementRate: number;
}

export interface DashboardState {
  productionRecords: ProductionData[];
  downtimeRecords: DowntimeData[];
  capaVariables: CapaVariables;
  selectedDateRange: [Date | null, Date | null];
  selectedProcess: string | 'All';
}
