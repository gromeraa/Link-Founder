import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import baseLibrary from '../data/library.json';
import type { Collection, Library, LinkItem, SortMode, ThemeMode } from './types';

/**
 * Como os dados funcionam
 * -----------------------
 * 1. A "base" vem de src/data/library.json (versionado no GitHub e publicado pela Vercel).
 * 2. Tudo o que você cria/edita pelo site fica num "overlay" salvo no navegador (localStorage).
 * 3. Em Ajustes → Exportar, você baixa um library.json novo (base + overlay).
 *    Substitua o arquivo no repositório, faça commit e a Vercel publica sozinha.
 */

const BASE = baseLibrary as Library;
const STORAGE_KEY = 'curadoria:v1';

interface Overlay {
  links: Record<string, LinkItem>;
  deletedLinks: string[];
  collections: Record<string, Collection>;
  deletedCollections: string[];
  favorites: Record<string, boolean>;
}

interface Prefs {
  theme: ThemeMode;
  sort: SortMode;
}

interface Persisted {
  overlay: Overlay;
  prefs: Prefs;
}

const EMPTY_OVERLAY: Overlay = {
  links: {},
  deletedLinks: [],
  collections: {},
  deletedCollections: [],
  favorites: {},
};

const DEFAULT_PREFS: Prefs = { theme: 'light', sort: 'recent' };

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        overlay: { ...EMPTY_OVERLAY, ...(p.overlay ?? {}) },
        prefs: { ...DEFAULT_PREFS, ...(p.prefs ?? {}) },
      };
    }
  } catch {
    /* navegador sem storage: segue só com a base */
  }
  return { overlay: EMPTY_OVERLAY, prefs: DEFAULT_PREFS };
}

function merge<T extends { id: string }>(base: T[], edits: Record<string, T>, deleted: string[]): T[] {
  const del = new Set(deleted);
  const baseIds = new Set(base.map((b) => b.id));
  const out = base.filter((b) => !del.has(b.id)).map((b) => edits[b.id] ?? b);
  for (const [id, item] of Object.entries(edits)) {
    if (!baseIds.has(id) && !del.has(id)) out.push(item);
  }
  return out;
}

interface Store {
  collections: Collection[];
  links: LinkItem[];
  prefs: Prefs;
  pendingChanges: number;
  collectionById: (id: string) => Collection | undefined;
  countFor: (collectionId: string) => number;
  saveLink: (link: LinkItem) => void;
  deleteLink: (id: string) => void;
  toggleFavorite: (id: string) => void;
  saveCollection: (c: Collection) => void;
  deleteCollection: (id: string) => void;
  setPrefs: (p: Partial<Prefs>) => void;
  exportLibrary: () => Library;
  importLibrary: (lib: Library) => void;
  resetLocal: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const { overlay, prefs } = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignora */
    }
  }, [state]);

  const collections = useMemo(
    () => merge(BASE.collections, overlay.collections, overlay.deletedCollections),
    [overlay.collections, overlay.deletedCollections],
  );

  const links = useMemo(() => {
    const colIds = new Set(collections.map((c) => c.id));
    return merge(BASE.links, overlay.links, overlay.deletedLinks)
      .filter((l) => colIds.has(l.collection))
      .map((l) => (l.id in overlay.favorites ? { ...l, favorite: overlay.favorites[l.id] } : l));
  }, [overlay.links, overlay.deletedLinks, overlay.favorites, collections]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of links) m.set(l.collection, (m.get(l.collection) ?? 0) + 1);
    return m;
  }, [links]);

  const update = useCallback((fn: (o: Overlay) => Overlay) => {
    setState((s) => ({ ...s, overlay: fn(s.overlay) }));
  }, []);

  const store: Store = {
    collections,
    links,
    prefs,
    pendingChanges:
      Object.keys(overlay.links).length +
      overlay.deletedLinks.length +
      Object.keys(overlay.collections).length +
      overlay.deletedCollections.length +
      Object.keys(overlay.favorites).length,
    collectionById: (id) => collections.find((c) => c.id === id),
    countFor: (id) => counts.get(id) ?? 0,
    saveLink: (link) =>
      update((o) => {
        const favorites = { ...o.favorites };
        delete favorites[link.id];
        return {
          ...o,
          links: { ...o.links, [link.id]: link },
          deletedLinks: o.deletedLinks.filter((x) => x !== link.id),
          favorites,
        };
      }),
    deleteLink: (id) =>
      update((o) => {
        const linksO = { ...o.links };
        delete linksO[id];
        const isBase = BASE.links.some((l) => l.id === id);
        return {
          ...o,
          links: linksO,
          deletedLinks: isBase && !o.deletedLinks.includes(id) ? [...o.deletedLinks, id] : o.deletedLinks,
        };
      }),
    toggleFavorite: (id) =>
      update((o) => {
        const current = links.find((l) => l.id === id)?.favorite ?? false;
        const original =
          o.links[id]?.favorite ?? BASE.links.find((l) => l.id === id)?.favorite ?? false;
        const favorites = { ...o.favorites };
        if (!current === original) delete favorites[id];
        else favorites[id] = !current;
        return { ...o, favorites };
      }),
    saveCollection: (c) =>
      update((o) => ({
        ...o,
        collections: { ...o.collections, [c.id]: c },
        deletedCollections: o.deletedCollections.filter((x) => x !== c.id),
      })),
    deleteCollection: (id) =>
      update((o) => {
        const cols = { ...o.collections };
        delete cols[id];
        const isBase = BASE.collections.some((c) => c.id === id);
        // remove também os links dessa coleção
        const linksO = { ...o.links };
        const deletedLinks = new Set(o.deletedLinks);
        for (const l of links.filter((x) => x.collection === id)) {
          delete linksO[l.id];
          if (BASE.links.some((b) => b.id === l.id)) deletedLinks.add(l.id);
        }
        return {
          ...o,
          collections: cols,
          links: linksO,
          deletedLinks: [...deletedLinks],
          deletedCollections:
            isBase && !o.deletedCollections.includes(id) ? [...o.deletedCollections, id] : o.deletedCollections,
        };
      }),
    setPrefs: (p) => setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } })),
    exportLibrary: () => ({
      collections,
      links: links.map((l) => {
        const out: LinkItem = { ...l };
        if (!out.favorite) delete out.favorite;
        if (!out.tags?.length) delete out.tags;
        if (!out.description) delete out.description;
        return out;
      }),
    }),
    importLibrary: (lib) =>
      update(() => ({
        links: Object.fromEntries(lib.links.map((l) => [l.id, l])),
        deletedLinks: BASE.links.map((l) => l.id).filter((id) => !lib.links.some((l) => l.id === id)),
        collections: Object.fromEntries(lib.collections.map((c) => [c.id, c])),
        deletedCollections: BASE.collections
          .map((c) => c.id)
          .filter((id) => !lib.collections.some((c) => c.id === id)),
        favorites: {},
      })),
    resetLocal: () => update(() => EMPTY_OVERLAY),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}
