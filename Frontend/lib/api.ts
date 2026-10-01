const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ApiResult<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown[];
};

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('tt_refresh_token') : null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json();
    if (json.success && json.data?.accessToken) {
      const newAccessToken = json.data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('tt_token', newAccessToken);
        if (json.data.refreshToken) {
          localStorage.setItem('tt_refresh_token', json.data.refreshToken);
        }
      }
      return newAccessToken;
    }
  } catch {
    // Refresh attempt failed
  }
  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tt_token') : null;
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...options.headers,
    },
    credentials: options.credentials ?? 'include',
    cache: options.cache ?? 'no-store',
  });

  const payload = (await response.json()) as ApiResult<T>;

  // If token is invalid or expired, attempt seamless token refresh
  if (
    response.status === 401 &&
    !isRetry &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/register')
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (newToken) {
        return apiFetch<T>(path, options, true);
      }
    } else {
      // Wait for existing refresh promise
      const newToken = await new Promise<string | null>((resolve) => {
        refreshSubscribers.push(resolve);
      });
      if (newToken) {
        return apiFetch<T>(path, options, true);
      }
    }
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

export { API_BASE_URL };
