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

export type AuthResult = {
  token: string;
  user: User;
};

type LoginPayload = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  role?: string;
};

// Backend returns inconsistent casing: login uses lowercase keys,
// register uses PascalCase. Normalize both to our User shape.
type RawUser = {
  UserID?: number;
  userID?: number;
  Username?: string;
  username?: string;
  Email?: string;
  email?: string;
  Role?: string;
  role?: string;
  WGCode?: string | null;
  wgCode?: string | null;
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

// ── Special errors ────────────────────────────────────────────────────────────

/** Thrown when the backend requires email verification before proceeding. */
export class VerificationRequiredError extends Error {
  email: string;
  constructor(email: string) {
    super('verification_required');
    this.name = 'VerificationRequiredError';
    this.email = email;
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

async function persistSession(result: AuthResult, rememberMe = false): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.token, result.token],
    [STORAGE_KEYS.user, JSON.stringify(result.user)],
    [STORAGE_KEYS.rememberMe, rememberMe ? 'true' : 'false'],
  ]);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.token);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user, STORAGE_KEYS.rememberMe]);
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

type LoginRaw =
  | { token: string; user: RawUser }
  | { status: 'verification_required'; message: string; email?: string };

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const raw = await api.post<LoginRaw>('/auth/login', payload);

  if ('status' in raw && raw.status === 'verification_required') {
    throw new VerificationRequiredError(raw.email ?? payload.username);
  }

  const { token, user } = raw as { token: string; user: RawUser };
  const result: AuthResult = { token, user: normalizeUser(user) };
  await persistSession(result, payload.rememberMe ?? false);
  return result;
}

/** Register user. Backend sends verification email and does NOT return a token. */
export async function register(payload: RegisterPayload): Promise<void> {
  await api.post('/auth/register', payload);
}

/** Verify email with code. Returns token + user and persists session. */
export async function verifyEmail(payload: { email: string; code: string }): Promise<AuthResult> {
  const raw = await api.post<{ token: string; user: RawUser }>('/auth/verify-email', payload);
  const result: AuthResult = { token: raw.token, user: normalizeUser(raw.user) };
  await persistSession(result);
  return result;
}

/** Request a new verification code. Backend enforces cooldown server-side. */
export async function resendVerification(payload: { email: string }): Promise<void> {
  await api.post('/auth/resend-verification', payload);
}

/** Step 1 — request password-reset code via email. */
export async function forgotPassword(payload: { email: string }): Promise<void> {
  await api.post('/auth/forgot-password', payload);
}

/** Step 2 — verify reset code, get one-time resetToken. */
export async function verifyResetCode(payload: { email: string; code: string }): Promise<{ resetToken: string }> {
  return api.post<{ resetToken: string }>('/auth/verify-reset-code', payload);
}

/** Step 3 — set new password using resetToken. */
export async function resetPassword(payload: { email: string; resetToken: string; newPassword: string }): Promise<void> {
  await api.post('/auth/reset-password', payload);
}
