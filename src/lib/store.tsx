import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError, setToken, type User } from './api';
import { STORAGE_PREFIX } from './config';
import type { Collection, Library, LinkItem, SortMode, ThemeMode } from './types';

/**
 * Como os dados funcionam
 * -----------------------
 * Os links ficam num banco (Upstash Redis) acessado pela API em /api, hospedada na Vercel.
 * Qualquer pessoa com o link vê a biblioteca; só quem entra com e-mail e senha edita.
 * Cada aparelho guarda uma cópia (cache) para abrir instantaneamente, e confere novidades
 * a cada 30 s e sempre que o app volta para a tela.
 */

const KEY = {
  token: `${STORAGE_PREFIX}:token`,
  user: `${STORAGE_PREFIX}:user`,
  prefs: `${STORAGE_PREFIX}:prefs`,
  cache: `${STORAGE_PREFIX}:cache`,
};

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    if (v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sem storage: segue sem cache */
  }
};

export type Status = 'loading' | 'ready' | 'error';

interface Prefs {
  theme: ThemeMode;
  sort: SortMode;
}
const DEFAULT_PREFS: Prefs = { theme: 'light', sort: 'recent' };
const EMPTY: Library = { collections: [], links: [] };

interface Store {
  status: Status;
  bootError: string;
  canEdit: boolean;
  collections: Collection[];
  links: LinkItem[];
  prefs: Prefs;
  user: User | null;
  syncing: boolean;
  lastSync: number | null;
  syncError: string | null;
  clearSyncError: () => void;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  changePassword: (current: string, next: string) => Promise<void>;
  logout: () => void;
  collectionById: (id: string) => Collection | undefined;
  countFor: (collectionId: string) => number;
  saveLink: (link: LinkItem) => void;
  deleteLink: (id: string) => void;
  toggleFavorite: (id: string) => void;
  saveCollection: (c: Collection) => void;
  deleteCollection: (id: string) => void;
  setPrefs: (p: Partial<Prefs>) => void;
  exportLibrary: () => Library;
  importLibrary: (lib: Library) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const cached = read<{ lib: Library; version: number } | null>(KEY.cache, null);
  const savedToken = read<string>(KEY.token, '');
  if (savedToken) setToken(savedToken);

  const [lib, setLib] = useState<Library>(cached?.lib ?? EMPTY);
  const [status, setStatus] = useState<Status>(cached ? 'ready' : 'loading');
  const [canEdit, setCanEdit] = useState(!!savedToken);
  const [bootError, setBootError] = useState('');
  const [prefs, setPrefsState] = useState<Prefs>(() => ({ ...DEFAULT_PREFS, ...read(KEY.prefs, {}) }));
  const [user, setUser] = useState<User | null>(() => (savedToken ? read<User | null>(KEY.user, null) : null));
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const libRef = useRef(lib);
  libRef.current = lib;
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;
  const version = useRef(cached?.version ?? 0);
  const pendingWrites = useRef(0);

  const commit = useCallback((next: Library, v?: number) => {
    setLib(next);
    if (v !== undefined) version.current = v;
    write(KEY.cache, { lib: next, version: version.current });
  }, []);

  /** Volta a ser só visitante (sessão apagada deste aparelho). */
  const lock = useCallback(() => {
    setToken('');
    write(KEY.token, undefined);
    write(KEY.user, undefined);
    setUser(null);
    setCanEdit(false);
  }, []);

  /** Busca a biblioteca no servidor (só baixa tudo se algo mudou). */
  const refresh = useCallback(async () => {
    if (pendingWrites.current > 0) return; // não sobrescreve edições em andamento
    setSyncing(true);
    try {
      const res = await api.library(version.current || undefined);
      if (pendingWrites.current > 0) return;
      if (!('unchanged' in res)) commit({ collections: res.collections, links: res.links }, res.version);
      if (!res.canEdit && read(KEY.token, '')) {
        lock();
        setSyncError('Sua sessão terminou. Entre de novo para editar.');
      } else {
        setCanEdit(res.canEdit);
        if (res.user) setUser(res.user);
      }
      setStatus('ready');
      setLastSync(Date.now());
    } catch (e) {
      const err = e as ApiError;
      if (!libRef.current.collections.length) {
        setBootError(err.message);
        setStatus('error');
      }
    } finally {
      setSyncing(false);
    }
  }, [commit, lock]);

  // primeira carga + atualização periódica
  useEffect(() => {
    refresh();
    const tick = () => document.visibilityState === 'visible' && refresh();
    const id = window.setInterval(tick, 30_000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  /** Aplica a mudança na hora (otimista) e envia ao servidor; se falhar, desfaz. */
  const mutate = useCallback(
    async (apply: (l: Library) => Library, send: () => Promise<unknown>) => {
      if (!canEditRef.current) {
        setSyncError('Entre com seu e-mail e senha para editar.');
        return;
      }
      const before = libRef.current;
      commit(apply(before));
      pendingWrites.current++;
      setSyncing(true);
      try {
        await send();
        setLastSync(Date.now());
      } catch (e) {
        const err = e as ApiError;
        commit(before);
        if (err.status === 401) {
          lock();
          setSyncError('Sua sessão terminou. Entre de novo para editar.');
        } else setSyncError(`Não foi possível salvar: ${err.message}`);
      } finally {
        pendingWrites.current--;
        setSyncing(false);
        if (pendingWrites.current === 0) {
          // confere se a outra pessoa mudou algo enquanto isso
          window.setTimeout(refresh, 300);
        }
      }
    },
    [commit, lock, refresh],
  );

  const { collections, links } = lib;
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of links) m.set(l.collection, (m.get(l.collection) ?? 0) + 1);
    return m;
  }, [links]);

  const upsert = <T extends { id: string }>(arr: T[], item: T) =>
    arr.some((x) => x.id === item.id) ? arr.map((x) => (x.id === item.id ? item : x)) : [...arr, item];

  const store: Store = {
    status,
    bootError,
    canEdit,
    collections,
    links,
    prefs,
    user,
    syncing,
    lastSync,
    syncError,
    clearSyncError: () => setSyncError(null),
    refresh,
    login: async (email, password) => {
      const { token, user: u } = await api.login(email, password);
      setToken(token);
      write(KEY.token, token);
      write(KEY.user, u);
      setUser(u);
      setCanEdit(true);
      setLastSync(Date.now());
      return u;
    },
    changePassword: async (current, next) => {
      const { token } = await api.changePassword(current, next);
      setToken(token);
      write(KEY.token, token);
    },
    logout: () => lock(),
    collectionById: (id) => collections.find((c) => c.id === id),
    countFor: (id) => counts.get(id) ?? 0,
    saveLink: (link) => {
      const item = { ...link };
      if (!item.addedBy && user && !links.some((l) => l.id === link.id)) item.addedBy = user.name;
      mutate((l) => ({ ...l, links: upsert(l.links, item) }), () => api.saveLink(item));
    },
    deleteLink: (id) =>
      mutate((l) => ({ ...l, links: l.links.filter((x) => x.id !== id) }), () => api.deleteLink(id)),
    toggleFavorite: (id) => {
      const current = links.find((l) => l.id === id);
      if (!current) return;
      const item: LinkItem = { ...current, favorite: !current.favorite || undefined };
      mutate((l) => ({ ...l, links: upsert(l.links, item) }), () => api.saveLink(item));
    },
    saveCollection: (c) => {
      const prev = collections.find((x) => x.id === c.id);
      const item = { ...c, order: prev?.order ?? c.order ?? Date.now() };
      mutate((l) => ({ ...l, collections: upsert(l.collections, item) }), () => api.saveCollection(item));
    },
    deleteCollection: (id) =>
      mutate(
        (l) => ({ collections: l.collections.filter((c) => c.id !== id), links: l.links.filter((x) => x.collection !== id) }),
        () => api.deleteCollection(id),
      ),
    setPrefs: (p) =>
      setPrefsState((s) => {
        const next = { ...s, ...p };
        write(KEY.prefs, next);
        return next;
      }),
    exportLibrary: () => ({
      collections: collections.map(({ order: _o, ...c }) => c),
      links,
    }),
    importLibrary: async (incoming) => {
      const normalized = { ...incoming, collections: incoming.collections.map((c, i) => ({ ...c, order: i })) };
      await mutate(() => normalized, () => api.replace(normalized));
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}
