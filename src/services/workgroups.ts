import { getToken } from '@/services/auth';
import { api } from '@/services/api';

export type WorkGroup = {
  WorkGroupID: number;
  WGCode: string;
  WGLeader: string;
  Foreman: string;
  Supervisor: string;
};

export type CreateWorkGroupPayload = {
  wgCode: string;
  wgLeader: string;
  foreman: string;
  supervisor: string;
  password: string;
  groupSelect: number;
};

export type UpdateWorkGroupPayload = {
  wgLeader?: string;
  foreman?: string;
  supervisor?: string;
  password?: string | null;
};

export async function getWorkGroups(): Promise<WorkGroup[]> {
  return api.get<WorkGroup[]>('/workgroups');
}

export async function createWorkGroup(payload: CreateWorkGroupPayload): Promise<WorkGroup> {
  const token = await getToken();
  return api.post<WorkGroup>('/workgroups', payload, { token: token ?? undefined });
}

export async function updateWorkGroup(wgCode: string, patch: UpdateWorkGroupPayload): Promise<WorkGroup> {
  const token = await getToken();
  return api.put<WorkGroup>(`/workgroups/${wgCode}`, patch, { token: token ?? undefined });
}

export async function deleteWorkGroup(wgCode: string): Promise<void> {
  const token = await getToken();
  await api.delete(`/workgroups/${wgCode}`, { token: token ?? undefined });
}
