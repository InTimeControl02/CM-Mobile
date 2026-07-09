// API configuration — values come from .env (EXPO_PUBLIC_* prefix required for client access).

/** Backend base URL. Override in .env via EXPO_PUBLIC_API_BASE_URL. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.100.23:3000';

/** Static API key sent in X-API-Key header on every request. */
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

/** AsyncStorage keys */
export const STORAGE_KEYS = {
  token: '@pcm/token',
  user: '@pcm/user',
  rememberMe: '@pcm/rememberMe',
  loginType: '@pcm/loginType',
  workgroup: '@pcm/workgroup',
} as const;
