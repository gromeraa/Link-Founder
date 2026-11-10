import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Collection, LinkItem } from './types';

type SheetState =
  | { kind: 'none' }
  | { kind: 'link'; link?: LinkItem; collectionId?: string }
  | { kind: 'collection'; collection?: Collection }
  | { kind: 'actions'; link: LinkItem }
  | { kind: 'login' }
  | { kind: 'password' }
  | { kind: 'collectionActions'; collection: Collection }
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmLabel: string;
      onConfirm: () => void;
    };

interface UI {
  sheet: SheetState;
  openLink: (opts?: { link?: LinkItem; collectionId?: string }) => void;
  openCollection: (collection?: Collection) => void;
  openActions: (link: LinkItem) => void;
  openLogin: () => void;
  openPassword: () => void;
  openCollectionActions: (collection: Collection) => void;
  confirm: (opts: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
  close: () => void;
  toast: { msg: string; kind: 'ok' | 'error' } | null;
  showToast: (msg: string, kind?: 'ok' | 'error') => void;
}

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const [toast, setToast] = useState<UI['toast']>(null);
  const timer = useRef<number>();

  const showToast = useCallback((msg: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ msg, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), kind === 'error' ? 4000 : 2000);
  }, []);

  const ui: UI = {
    sheet,
    openLink: (opts) => setSheet({ kind: 'link', ...opts }),
    openCollection: (collection) => setSheet({ kind: 'collection', collection }),
    openActions: (link) => setSheet({ kind: 'actions', link }),
    openLogin: () => setSheet({ kind: 'login' }),
    openPassword: () => setSheet({ kind: 'password' }),
    openCollectionActions: (collection) => setSheet({ kind: 'collectionActions', collection }),
    confirm: (opts) => setSheet({ kind: 'confirm', ...opts }),
    close: () => setSheet({ kind: 'none' }),
    toast,
    showToast,
  };
  return <Ctx.Provider value={ui}>{children}</Ctx.Provider>;
}

export function useUI() {
  const u = useContext(Ctx);
  if (!u) throw new Error('useUI fora do UIProvider');
  return u;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
