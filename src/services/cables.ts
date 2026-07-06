import { api } from '@/services/api';

export type CableFilterType = 'all' | 'pulling' | 'testing' | 'connecting';

export type Cable = {
  CableNo: string;
  FromEqNo: string;
  FromEqDescription: string;
  FromLocation: string | null;
  ToEqNo: string;
  ToEqDescription: string;
  ToLocation: string | null;
  CableType: string;
  // Drum / reel
  DrumNo?: string | null;
  // Lengths (present on detail endpoint)
  DesignLength?: number | null;
  PulledLength?: number | null;
  // Workgroup codes (present on detail endpoint)
  WGPulled?: string | null;
  WGTested?: string | null;
  WGConnected_From?: string | null;
  WGConnected_To?: string | null;
  // Pending notes
  PulledPending?: string | null;
  ConnectedPending_From?: string | null;
  ConnectedPending_To?: string | null;
  // General remarks
  Remarks?: string | null;
  // Status dates
  PulledDate?: string | null;
  TestedDate?: string | null;
  ConnectedDate_From?: string | null;
  ConnectedDate_To?: string | null;
  // Test requirements (-1 = required, 0 = not required)
  NeedInsulTest?: number | null;
  NeedHipotTest?: number | null;
};

export async function getCable(cableNo: string): Promise<Cable> {
  return api.get<Cable>(`/cables/${encodeURIComponent(cableNo)}`);
}

export const CABLES_PAGE_LIMIT = 20;

type CablesResponse = Cable[] | { data: Cable[]; total?: number; page?: number };

export async function getCables(
  type: CableFilterType,
  search?: string,
  page: number = 1,
  limit: number = CABLES_PAGE_LIMIT,
): Promise<Cable[]> {
  const params = new URLSearchParams({ type, page: String(page), limit: String(limit) });
  if (search?.trim()) params.set('search', search.trim());
  const res = await api.get<CablesResponse>(`/cables?${params.toString()}`);
  return Array.isArray(res) ? res : res.data;
}

// ── Submit types (one per wizard step) ───────────────────────────────────────

export type PullFormData = {
  reelNo: string;
  designLength: string;
  actualLength: string;
  pulledDate: string;
  wgCode: string;
  oficial: string;
  cabo: string;
  supervisor: string;
  pendientes: string;
};

export type TestFormData = {
  testedDate: string;
  wgCode: string;
  oficial: string;
  cabo: string;
  supervisor: string;
  pruebaMeg: boolean;
  pruebaHipot: boolean;
};

export type ConnectFormData = {
  // From (Origen)
  fromDate: string;
  fromWGCode: string;
  fromOficial: string;
  fromCabo: string;
  fromSupervisor: string;
  fromPendientes: string;
  // To (Destino)
  toDate: string;
  toWGCode: string;
  toOficial: string;
  toCabo: string;
  toSupervisor: string;
  toPendientes: string;
  // General
  observaciones: string;
};

type UpdateCableResponse = Cable | { cable: Cable } | { data: Cable };

// Partial update — only send the fields that changed. CableNo is the URL key,
// not editable. null clears a field. Dates must be "YYYY-MM-DD".
export async function updateCable(cableNo: string, patch: Record<string, unknown>): Promise<Cable> {
  const res = await api.put<UpdateCableResponse>(`/cables/${encodeURIComponent(cableNo)}`, patch);
  if ('cable' in res) return res.cable;
  if ('data' in res) return res.data;
  return res;
}
