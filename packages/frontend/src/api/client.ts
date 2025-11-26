/**
 * API Client for backend communication
 * Handles CSRF tokens, authentication, and error responses
 */

let csrfToken: string | null = null;

/**
 * Fetch and cache CSRF token
 * Should be called on app initialization
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Get cached CSRF token
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Unauthorized Error class
 * Components should catch this error and navigate to /login using React Router
 */
export class UnauthorizedError extends ApiError {
  constructor() {
    super('Unauthorized', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Generic fetcher function for SWR
 * Automatically includes credentials and handles common errors
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `API error: ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * API request options
 */
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Generic API request function
 * Handles CSRF tokens for state-changing requests
 */
export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // Include CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  // Set content type for JSON bodies
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle 401 Unauthorized - throw UnauthorizedError
    // Components should catch this and navigate to /login using React Router
    if (response.status === 401) {
      throw new UnauthorizedError();
    }

    throw new ApiError(
      errorData.message || `API error: ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * SWR configuration defaults
 */
export const swrConfig = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  shouldRetryOnError: (error: Error) => {
    // Don't retry on 4xx errors (client errors)
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return false;
    }
    return true;
  },
};
