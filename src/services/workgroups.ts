import { api } from '@/services/api';

export type WorkGroup = {
  WorkGroupID: number;
  WGCode: string;
  WGLeader: string;
  Foreman: string;
  Supervisor: string;
};

export async function getWorkGroups(): Promise<WorkGroup[]> {
  return api.get<WorkGroup[]>('/workgroups');
}
