import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Collection, LinkItem } from './types';

type SheetState =
  | { kind: 'none' }
  | { kind: 'link'; link?: LinkItem; collectionId?: string }
  | { kind: 'collection'; collection?: Collection }
  | { kind: 'actions'; link: LinkItem }
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
  openCollectionActions: (collection: Collection) => void;
  confirm: (opts: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
  close: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  const ui: UI = {
    sheet,
    openLink: (opts) => setSheet({ kind: 'link', ...opts }),
    openCollection: (collection) => setSheet({ kind: 'collection', collection }),
    openActions: (link) => setSheet({ kind: 'actions', link }),
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
