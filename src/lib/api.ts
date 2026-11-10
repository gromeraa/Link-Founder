import type { Collection, Library, LibraryResponse, LinkItem } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let accessCode = '';
export const setAccessCode = (c: string) => (accessCode = c);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(accessCode ? { authorization: `Bearer ${accessCode}` } : {}),
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
    call<LibraryResponse | { unchanged: true; version: number }>(`library${since ? `?v=${since}` : ''}`),
  replace: (lib: Library) => call<Ok>('library', { method: 'PUT', body: JSON.stringify(lib) }),
  saveLink: (l: LinkItem) => call<Ok>('links', { method: 'POST', body: JSON.stringify(l) }),
  deleteLink: (id: string) => call<Ok>(`links?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  saveCollection: (c: Collection) => call<Ok>('collections', { method: 'POST', body: JSON.stringify(c) }),
  deleteCollection: (id: string) => call<Ok>(`collections?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
