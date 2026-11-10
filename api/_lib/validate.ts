import type { Collection, ColorName, Library, LinkItem } from './types.js';

const COLORS: ColorName[] = ['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'gray'];
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const opt = (v: unknown, max: number) => str(v, max) || undefined;

export class BadRequest extends Error {}

export function cleanLink(raw: unknown): LinkItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = str(r.id, 64);
  const url = str(r.url, 2000);
  const title = str(r.title, 200);
  const collection = str(r.collection, 64);
  const addedAt = str(r.addedAt, 10);
  if (!ID.test(id)) throw new BadRequest('id inválido');
  if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(url)) throw new BadRequest('URL inválida');
  if (!title) throw new BadRequest('título obrigatório');
  if (!ID.test(collection)) throw new BadRequest('coleção inválida');
  if (!DATE.test(addedAt)) throw new BadRequest('data inválida');
  const tags = Array.isArray(r.tags)
    ? [...new Set(r.tags.map((t) => str(t, 40).toLowerCase()).filter(Boolean))].slice(0, 20)
    : [];
  const link: LinkItem = { id, url, title, collection, addedAt };
  const description = opt(r.description, 1000);
  const addedBy = opt(r.addedBy, 40);
  if (description) link.description = description;
  if (addedBy) link.addedBy = addedBy;
  if (tags.length) link.tags = tags;
  if (r.favorite === true) link.favorite = true;
  return link;
}

export function cleanCollection(raw: unknown): Collection {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = str(r.id, 64);
  const name = str(r.name, 60);
  const icon = str(r.icon, 40) || 'folder';
  const color = COLORS.includes(r.color as ColorName) ? (r.color as ColorName) : 'blue';
  if (!ID.test(id)) throw new BadRequest('id inválido');
  if (!name) throw new BadRequest('nome obrigatório');
  const c: Collection = { id, name, icon, color };
  const description = opt(r.description, 300);
  if (description) c.description = description;
  if (typeof r.order === 'number' && Number.isFinite(r.order)) c.order = r.order;
  return c;
}

export function cleanLibrary(raw: unknown): Library {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (!Array.isArray(r.collections) || !Array.isArray(r.links)) throw new BadRequest('formato inválido');
  const collections = r.collections.map((c, i) => ({ order: i, ...cleanCollection(c) }));
  const ids = new Set(collections.map((c) => c.id));
  const links = r.links.map(cleanLink).filter((l) => ids.has(l.collection));
  return { collections, links };
}
