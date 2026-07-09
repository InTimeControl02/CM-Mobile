import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/config';
import { ApiError, api } from '@/services/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type User = {
  userID: number;
  username: string;
  email: string;
  role: string;
  wgCode: string | null;
};

export type WorkGroupAuth = {
  wgCode: string;
  wgLeader: string;
  foreman: string;
  supervisor: string;
};

export type AuthResult = {
  token: string;
  loginType: 'admin' | 'worker';
  user?: User;
  workgroup?: WorkGroupAuth;
};

type LoginPayload = {
  username?: string;
  wgCode?: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  role?: string;
};

// Backend returns inconsistent casing — normalize to our User shape.
type RawUser = {
  UserID?: number; userID?: number;
  Username?: string; username?: string;
  Email?: string; email?: string;
  Role?: string; role?: string;
  WGCode?: string | null; wgCode?: string | null;
};

function normalizeUser(raw: RawUser): User {
  return {
    userID: raw.userID ?? raw.UserID ?? 0,
    username: raw.username ?? raw.Username ?? '',
    email: raw.email ?? raw.Email ?? '',
    role: raw.role ?? raw.Role ?? 'user',
    wgCode: raw.wgCode ?? raw.WGCode ?? null,
  };
}

type RawWorkGroup = {
  WGCode?: string; wgCode?: string;
  WGLeader?: string; wgLeader?: string;
  Foreman?: string; foreman?: string;
  Supervisor?: string; supervisor?: string;
};

function normalizeWorkGroup(raw: RawWorkGroup): WorkGroupAuth {
  return {
    wgCode: raw.WGCode ?? raw.wgCode ?? '',
    wgLeader: raw.WGLeader ?? raw.wgLeader ?? '',
    foreman: raw.Foreman ?? raw.foreman ?? '',
    supervisor: raw.Supervisor ?? raw.supervisor ?? '',
  };
}

// ── Special errors ─────────────────────────────────────────────────────────

export class VerificationRequiredError extends Error {
  email: string;
  constructor(email: string) {
    super('verification_required');
    this.name = 'VerificationRequiredError';
    this.email = email;
  }
}

// ── Storage ───────────────────────────────────────────────────────────────

async function persistSession(result: AuthResult, rememberMe = false): Promise<void> {
  const entries: [string, string][] = [
    [STORAGE_KEYS.token, result.token],
    [STORAGE_KEYS.rememberMe, rememberMe ? 'true' : 'false'],
    [STORAGE_KEYS.loginType, result.loginType],
  ];
  if (result.user) entries.push([STORAGE_KEYS.user, JSON.stringify(result.user)]);
  if (result.workgroup) entries.push([STORAGE_KEYS.workgroup, JSON.stringify(result.workgroup)]);
  await AsyncStorage.multiSet(entries);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.token);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function getLoginType(): Promise<'admin' | 'worker' | null> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.loginType);
  return (val as 'admin' | 'worker') ?? null;
}

export async function getStoredWorkgroup(): Promise<WorkGroupAuth | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.workgroup);
  return raw ? (JSON.parse(raw) as WorkGroupAuth) : null;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.user,
    STORAGE_KEYS.rememberMe,
    STORAGE_KEYS.loginType,
    STORAGE_KEYS.workgroup,
  ]);
}

// ── Endpoints ──────────────────────────────────────────────────────────────

type LoginRaw =
  | { token: string; loginType: 'admin'; user: RawUser }
  | { token: string; loginType: 'worker'; workgroup: RawWorkGroup }
  | { status: 'verification_required'; message: string; email?: string };

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const raw = await api.post<LoginRaw>('/auth/login', payload);

  if ('status' in raw && raw.status === 'verification_required') {
    throw new VerificationRequiredError(raw.email ?? payload.username ?? '');
  }

  let result: AuthResult;
  if (raw.loginType === 'worker') {
    result = {
      token: raw.token,
      loginType: 'worker',
      workgroup: normalizeWorkGroup((raw as { token: string; loginType: 'worker'; workgroup: RawWorkGroup }).workgroup),
    };
  } else {
    result = {
      token: raw.token,
      loginType: 'admin',
      user: normalizeUser((raw as { token: string; loginType: 'admin'; user: RawUser }).user),
    };
  }

  await persistSession(result, payload.rememberMe ?? false);
  return result;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await api.post('/auth/register', payload);
}

export async function verifyEmail(payload: { email: string; code: string }): Promise<AuthResult> {
  const raw = await api.post<{ token: string; user: RawUser }>('/auth/verify-email', payload);
  const result: AuthResult = { token: raw.token, loginType: 'admin', user: normalizeUser(raw.user) };
  await persistSession(result, false);
  return result;
}

export async function resendVerification(payload: { email: string }): Promise<void> {
  await api.post('/auth/resend-verification', payload);
}

export async function forgotPassword(payload: { email: string }): Promise<void> {
  await api.post('/auth/forgot-password', payload);
}

export async function verifyResetCode(payload: { email: string; code: string }): Promise<{ resetToken: string }> {
  return api.post<{ resetToken: string }>('/auth/verify-reset-code', payload);
}

export async function resetPassword(payload: { email: string; resetToken: string; newPassword: string }): Promise<void> {
  await api.post('/auth/reset-password', payload);
}
