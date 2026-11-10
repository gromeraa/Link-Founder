import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Check, Plus } from 'lucide-react';
import type { Collection, LinkItem, SortMode } from '../lib/types';
import { useStore } from '../lib/store';
import { plural, SORT_LABELS, sortLinks } from '../lib/utils';
import { iconFor } from '../lib/icons';
import { LinkCard } from './LinkCard';
import { spring } from './primitives';

export function SortMenu() {
  const { prefs, setPrefs } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="sort-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <ArrowUpDown />
        {SORT_LABELS[prefs.sort]}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            role="menu"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4, transition: { duration: 0.12 } }}
            transition={spring}
          >
            {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
              <button
                key={m}
                role="menuitemradio"
                aria-checked={prefs.sort === m}
                className="menu-item"
                onClick={() => {
                  setPrefs({ sort: m });
                  setOpen(false);
                }}
              >
                {SORT_LABELS[m]}
                {prefs.sort === m && <Check className="check" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Chips de filtro por coleção. "Todos" + cada coleção + "Novo filtro". */
export function CollectionChips({
  value,
  onChange,
  onAdd,
  counts,
}: {
  value: string;
  onChange: (id: string) => void;
  onAdd?: () => void;
  counts?: Map<string, number>;
}) {
  const { collections, links } = useStore();
  const items: (Pick<Collection, 'id' | 'name'> & Partial<Collection>)[] = [
    { id: 'all', name: 'Todos' },
    ...collections,
  ];
  return (
    <div className="chips" role="tablist" aria-label="Filtrar por coleção">
      {items.map((c) => {
        const Icon = c.icon ? iconFor(c.icon) : null;
        const active = value === c.id;
        const n = c.id === 'all' ? counts?.get('all') ?? links.length : counts?.get(c.id) ?? 0;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            className={`chip ${active ? 'active' : ''}`}
            data-color={c.color}
            onClick={() => onChange(c.id)}
          >
            {active && <motion.span layoutId="chip-bg" className="chip-bg" transition={spring} />}
            {Icon && <Icon />}
            {c.name}
            <span className="count">{n}</span>
          </button>
        );
      })}
      {onAdd && (
        <button className="chip add" onClick={onAdd}>
          <Plus /> Novo filtro
        </button>
      )}
    </div>
  );
}

export function TagChips({ tags, value, onChange }: { tags: [string, number][]; value: string; onChange: (t: string) => void }) {
  if (!tags.length) return null;
  return (
    <div className="chips" role="tablist" aria-label="Filtrar por marcador" style={{ marginTop: 12 }}>
      {[['', 0] as [string, number], ...tags].map(([t, n]) => {
        const active = value === t;
        return (
          <button key={t || 'all'} role="tab" aria-selected={active} className={`chip tag ${active ? 'active' : ''}`} onClick={() => onChange(t)}>
            {active && <motion.span layoutId="tag-bg" className="chip-bg" transition={spring} />}
            {t ? `#${t}` : 'Todos'}
            {t && <span className="count">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function LinkGrid({
  links,
  showCollection = true,
  empty,
}: {
  links: LinkItem[];
  showCollection?: boolean;
  empty: ReactNode;
}) {
  const { prefs } = useStore();
  const sorted = sortLinks(links, prefs.sort);
  return (
    <>
      <div className="toolbar">
        <span className="result-count">
          <span className="dot" />
          {plural(sorted.length, 'link', 'links')}
        </span>
        <SortMenu />
      </div>
      {sorted.length === 0 ? (
        empty
      ) : (
        <motion.div layout className="grid">
          <AnimatePresence mode="popLayout">
            {sorted.map((l, i) => (
              <LinkCard key={l.id} link={l} index={i} showCollection={showCollection} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
