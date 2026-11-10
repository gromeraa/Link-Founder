import type { Collection, Library, LibraryResponse, LinkItem } from './types';

export interface User {
  name: string;
  email: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let sessionToken = '';
export const setToken = (t: string) => (sessionToken = t);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('Sem conexão com a internet', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Erro ${res.status}`, res.status);
  return data as T;
}

type Ok = { ok: true; version: number };

export const api = {
  library: (since?: number) =>
    call<(LibraryResponse | { unchanged: true; version: number }) & { canEdit: boolean; user: User | null }>(
      `library${since ? `?v=${since}` : ''}`,
    ),
  login: (email: string, password: string) =>
    call<{ token: string; user: User }>('auth?action=login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  changePassword: (current: string, next: string) =>
    call<{ token: string }>('auth?action=password', { method: 'POST', body: JSON.stringify({ current, next }) }),
  replace: (lib: Library) => call<Ok>('library', { method: 'PUT', body: JSON.stringify(lib) }),
  saveLink: (l: LinkItem) => call<Ok>('links', { method: 'POST', body: JSON.stringify(l) }),
  deleteLink: (id: string) => call<Ok>(`links?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  saveCollection: (c: Collection) => call<Ok>('collections', { method: 'POST', body: JSON.stringify(c) }),
  deleteCollection: (id: string) => call<Ok>(`collections?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
