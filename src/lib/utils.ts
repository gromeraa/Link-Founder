import type { LinkItem, SortMode } from './types';

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function faviconUrl(url: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainOf(url))}&sz=${size}`;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function uniqueId(base: string, taken: Set<string>): string {
  const root = slugify(base) || 'item';
  if (!taken.has(root)) return root;
  let i = 2;
  while (taken.has(`${root}-${i}`)) i++;
  return `${root}-${i}`;
}

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function relativeDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const then = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((now.getTime() - then.getTime()) / 86400000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? 'Há 1 semana' : `Há ${w} semanas`;
  }
  if (days < 365) {
    const mo = Math.floor(days / 30);
    return mo === 1 ? 'Há 1 mês' : `Há ${mo} meses`;
  }
  return then.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fullDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function matchesQuery(link: LinkItem, query: string, collectionName = ''): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const hay = fold(
    [link.title, link.description, link.url, collectionName, ...(link.tags ?? [])].join(' '),
  );
  return q.split(/\s+/).every((t) => hay.includes(t.replace(/^#/, '')));
}

export function sortLinks(list: LinkItem[], mode: SortMode): LinkItem[] {
  const arr = [...list];
  switch (mode) {
    case 'recent':
      return arr.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title, 'pt-BR'));
    case 'oldest':
      return arr.sort((a, b) => a.addedAt.localeCompare(b.addedAt) || a.title.localeCompare(b.title, 'pt-BR'));
    case 'az':
      return arr.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    case 'domain':
      return arr.sort((a, b) => domainOf(a.url).localeCompare(domainOf(b.url)));
  }
}

export const SORT_LABELS: Record<SortMode, string> = {
  recent: 'Mais recentes',
  oldest: 'Mais antigos',
  az: 'Nome (A–Z)',
  domain: 'Domínio',
};

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
