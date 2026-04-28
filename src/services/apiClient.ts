import { auth } from '../lib/firebase';

type ApiRequestInit = RequestInit & {
  includeAuth?: boolean;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildAuthHeader = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const token = await currentUser.getIdToken(false);
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
};

export const apiFetch = async (url: string, init: ApiRequestInit = {}) => {
  const { includeAuth = true, headers, ...restInit } = init;
  const nextHeaders = new Headers(headers || {});

  if (includeAuth) {
    const authHeader = await buildAuthHeader();
    if (authHeader) {
      nextHeaders.set('Authorization', authHeader);
    }
  }

  const response = await fetch(url, {
    ...restInit,
    headers: nextHeaders,
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const message = payload?.error || payload?.message || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status);
  }

  return response;
};
