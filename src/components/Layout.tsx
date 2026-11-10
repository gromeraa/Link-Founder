import { useId, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Bookmark, CheckCircle2, Compass, FolderClosed, KeyRound, Plus, Settings } from 'lucide-react';
import { APP_NAME } from '../lib/config';
import { useStore } from '../lib/store';
import { useUI } from '../lib/ui';
import { iconFor } from '../lib/icons';
import { spring, useScrolled } from './primitives';

export const NAV = [
  { to: '/', label: 'Explorar', icon: Compass },
  { to: '/colecoes', label: 'Coleções', icon: FolderClosed },
  { to: '/salvos', label: 'Salvos', icon: Bookmark },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

export function Logo() {
  const gid = `lg-${useId().replace(/:/g, '')}`;
  return (
    <svg className="brand-logo" viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3395FF" />
          <stop offset="1" stopColor="#0058BC" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gid})`} />
      <path d="M22 16h20a3 3 0 0 1 3 3v29l-13-8-13 8V19a3 3 0 0 1 3-3z" fill="#fff" />
    </svg>
  );
}

export function Brand({ sub, className = '' }: { sub?: string; className?: string }) {
  return (
    <Link to="/" className={`brand ${className}`}>
      <Logo />
      <span className="brand-text">
        <span className="brand-name">{APP_NAME}</span>
        {sub && <span className="brand-sub">{sub}</span>}
      </span>
    </Link>
  );
}

export function TopBar({ title, children, brand = true }: { title: string; children?: ReactNode; brand?: boolean }) {
  const scrolled = useScrolled();
  const { openLink } = useUI();
  const { canEdit } = useStore();
  return (
    <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container topbar-inner">
        {brand ? (
          <>
            <Brand sub={title} className="mobile-only" />
            <span className="topbar-title" style={{ textAlign: 'left' }}>{title}</span>
          </>
        ) : (
          <span className="topbar-title">{title}</span>
        )}
        <div className="topbar-actions">
          {children}
          {canEdit && (
            <motion.button whileTap={{ scale: 0.9 }} className="icon-btn glassy mobile-only" onClick={() => openLink()} aria-label="Adicionar link">
              <Plus />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tabbar glass" aria-label="Navegação principal">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = isActive(pathname, to);
        return (
          <Link key={to} to={to} className={`tab ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
            {active && <motion.span layoutId="tab-pill" className="tab-pill" transition={spring} />}
            <Icon strokeWidth={active ? 2.3 : 1.9} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { collections, countFor, links, user, canEdit } = useStore();
  const { openLink, openCollection, openLogin } = useUI();
  const favs = links.filter((l) => l.favorite).length;
  const counts: Record<string, number> = { '/': links.length, '/salvos': favs, '/colecoes': collections.length };
  return (
    <aside className="sidebar glass" aria-label="Barra lateral">
      <Brand sub={canEdit && user ? `Olá, ${user.name}` : 'Nossos links'} />
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === '/colecoes' ? pathname === to : isActive(pathname, to);
        return (
          <Link key={to} to={to} className={`side-link ${active ? 'active' : ''}`}>
            {active && <motion.span layoutId="side-pill" className="side-pill" transition={spring} />}
            <Icon />
            {label}
            {counts[to] !== undefined && <span className="n">{counts[to]}</span>}
          </Link>
        );
      })}
      <div className="side-label">
        Coleções
        {canEdit && (
          <button onClick={() => openCollection()} aria-label="Nova coleção" title="Nova coleção">
            <Plus />
          </button>
        )}
      </div>
      {collections.map((c) => {
        const Icon = iconFor(c.icon);
        const to = `/colecoes/${c.id}`;
        const active = pathname === to;
        return (
          <Link key={c.id} to={to} className={`side-link ${active ? 'active' : ''}`} data-color={c.color}>
            {active && <motion.span layoutId="side-pill" className="side-pill" transition={spring} />}
            <span className="dot"><Icon /></span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            <span className="n">{countFor(c.id)}</span>
          </Link>
        );
      })}
      {canEdit ? (
        <button className="btn btn-primary" style={{ marginTop: 'auto', flexShrink: 0 }} onClick={() => openLink()}>
          <Plus /> Novo link
        </button>
      ) : (
        <button className="btn btn-ghost" style={{ marginTop: 'auto', flexShrink: 0, height: 40 }} onClick={() => openLogin()}>
          <KeyRound /> Entrar
        </button>
      )}
    </aside>
  );
}

export function Toast() {
  const { toast } = useUI();
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.msg}
            className={`toast ${toast.kind}`}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={spring}
          >
            {toast.kind === 'error' ? <AlertCircle /> : <CheckCircle2 />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

/** Transição de página (fade + leve subida). */
export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
    >
      {children}
    </motion.div>
  );
}
