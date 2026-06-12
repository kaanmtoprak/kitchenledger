import { clearAccessToken, getAccessToken, setAccessToken } from '../auth/token-storage';
import { getSelectedOrganizationId } from '../auth/organization-storage';
import { ApiError } from './api-error';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuthRetry?: boolean;
};

let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
}

function shouldSkipRefresh(path: string): boolean {
  return NO_REFRESH_PATHS.some((authPath) => path.startsWith(authPath));
}

function extractErrorMessage(payload: {
  message?: string | string[] | Record<string, unknown>;
}): string {
  const { message } = payload;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (message && typeof message === 'object') {
    const structured = message as { message?: string; code?: string };
    if (typeof structured.message === 'string') {
      return structured.message;
    }
    if (typeof structured.code === 'string') {
      return structured.code;
    }
  }

  return 'Request failed';
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let message = response.statusText || 'Request failed';
  let details: unknown;

  try {
    const data = (await response.json()) as {
      message?: string | string[] | Record<string, unknown>;
    };
    message = extractErrorMessage(data);
    details = data;
  } catch {
    // ignore JSON parse errors
  }

  return new ApiError(response.status, message, details);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  const accessToken = getAccessToken();
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const organizationId = getSelectedOrganizationId();
  if (organizationId) {
    requestHeaders.set('x-organization-id', organizationId);
  }

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: requestHeaders,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuthRetry && !isRetry && !shouldSkipRefresh(path)) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      return request<T>(path, options, true);
    }

    clearAccessToken();
    onUnauthorized?.();
    throw await parseErrorResponse(response);
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
