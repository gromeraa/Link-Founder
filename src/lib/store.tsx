import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError, setAccessCode } from './api';
import { STORAGE_PREFIX } from './config';
import type { Collection, Library, LinkItem, SortMode, ThemeMode } from './types';

/**
 * Como os dados funcionam
 * -----------------------
 * Os links ficam num banco (Upstash Redis) acessado pela API em /api, hospedada na Vercel.
 * Qualquer pessoa com o link vê a biblioteca; só quem tem o código de acesso edita.
 * Cada aparelho guarda uma cópia (cache) para abrir instantaneamente, e confere novidades
 * a cada 30 s e sempre que o app volta para a tela.
 */

const KEY = {
  code: `${STORAGE_PREFIX}:code`,
  name: `${STORAGE_PREFIX}:name`,
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
  userName: string;
  syncing: boolean;
  lastSync: number | null;
  syncError: string | null;
  clearSyncError: () => void;
  refresh: () => Promise<void>;
  login: (code: string, name: string) => Promise<void>;
  logout: () => void;
  setUserName: (name: string) => void;
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
  const savedCode = read<string>(KEY.code, '');
  if (savedCode) setAccessCode(savedCode);

  const [lib, setLib] = useState<Library>(cached?.lib ?? EMPTY);
  const [status, setStatus] = useState<Status>(cached ? 'ready' : 'loading');
  const [canEdit, setCanEdit] = useState(!!savedCode);
  const [bootError, setBootError] = useState('');
  const [prefs, setPrefsState] = useState<Prefs>(() => ({ ...DEFAULT_PREFS, ...read(KEY.prefs, {}) }));
  const [userName, setUserNameState] = useState(() => read(KEY.name, ''));
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

  /** Volta a ser só visitante (código apagado deste aparelho). */
  const lock = useCallback(() => {
    setAccessCode('');
    write(KEY.code, undefined);
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
      if (!res.canEdit && read(KEY.code, '')) {
        lock();
        setSyncError('O código de acesso mudou. Entre de novo para editar.');
      } else setCanEdit(res.canEdit);
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
        setSyncError('Entre com o código de acesso para editar.');
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
          setSyncError('Só quem tem o código de acesso pode editar.');
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
    userName,
    syncing,
    lastSync,
    syncError,
    clearSyncError: () => setSyncError(null),
    refresh,
    login: async (code, name) => {
      setAccessCode(code.trim());
      try {
        const res = await api.library();
        if ('unchanged' in res) throw new ApiError('Resposta inesperada', 500);
        if (!res.canEdit) throw new ApiError('Código de acesso incorreto.', 401);
        write(KEY.code, code.trim());
        write(KEY.name, name.trim());
        setUserNameState(name.trim());
        commit({ collections: res.collections, links: res.links }, res.version);
        setLastSync(Date.now());
        setCanEdit(true);
      } catch (e) {
        setAccessCode('');
        throw e;
      }
    },
    logout: () => lock(),
    setUserName: (name) => {
      setUserNameState(name);
      write(KEY.name, name.trim());
    },
    collectionById: (id) => collections.find((c) => c.id === id),
    countFor: (id) => counts.get(id) ?? 0,
    saveLink: (link) => {
      const item = { ...link };
      if (!item.addedBy && userName && !links.some((l) => l.id === link.id)) item.addedBy = userName;
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
