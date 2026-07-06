import { API_BASE_URL, API_KEY } from '@/constants/config';

/** Error thrown on non-2xx responses. Carries HTTP status + server message + raw body. */
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data ?? null;
  }
}

type RequestOptions = {
  /** JWT for authenticated routes. Adds Authorization: Bearer <token>. */
  token?: string;
  /** Parsed JSON body. */
  body?: unknown;
};

/**
 * Low-level request helper. Injects X-API-Key on every call,
 * sets JSON headers, and maps backend errors to ApiError.
 */
async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, body } = options;

  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network failure (server down, wrong IP, no WiFi, etc.)
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica tu conexión.');
  }

  // Parse body (may be empty on some responses)
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      (data && Array.isArray(data.errors) && data.errors.join(' ')) ||
      `Error ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
