import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { domainOf, faviconUrl } from '../lib/utils';
import type { ColorName } from '../lib/types';

export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const;
export const softSpring = { type: 'spring', stiffness: 260, damping: 30 } as const;

/** Favicon do site com fallback para a inicial colorida. */
export function Favicon({ url, color = 'blue', size }: { url: string; color?: ColorName; size?: 'lg' }) {
  const [failed, setFailed] = useState(false);
  const domain = domainOf(url);
  const letter = domain.charAt(0).toUpperCase();
  if (failed || !domain) {
    return (
      <span className={`favicon fallback ${size ?? ''}`} data-color={color} aria-hidden>
        {letter || '•'}
      </span>
    );
  }
  return (
    <span className={`favicon ${size ?? ''}`} aria-hidden>
      <img
        src={faviconUrl(url, size === 'lg' ? 128 : 64)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          // o serviço devolve um globo 16x16 genérico quando não acha o ícone
          if ((e.currentTarget.naturalWidth || 0) <= 16) setFailed(true);
        }}
      />
    </span>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <motion.span layout transition={spring} className="switch-knob" />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  id,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="seg-thumb" transition={spring} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  shortcut = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  shortcut?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = /INPUT|TEXTAREA/.test(target.tagName);
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut]);

  return (
    <label className="search">
      <Search />
      <span className="sr-only">{placeholder}</span>
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
        enterKeyHint="search"
        autoComplete="off"
      />
      {value ? (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Limpar busca">
          <span>
            <X />
          </span>
        </button>
      ) : (
        shortcut && <kbd className="kbd">/</kbd>
      )}
    </label>
  );
}

export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </motion.div>
  );
}

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return match;
}

/** true quando a página rolou além do limite (para a barra ganhar vidro). */
export function useScrolled(limit = 8) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > limit);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [limit]);
  return s;
}
