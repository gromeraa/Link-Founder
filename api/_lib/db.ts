import { Redis } from '@upstash/redis';
import { SEED } from './seed.js';
import type { Collection, Library, LibraryResponse, LinkItem } from './types.js';

/**
 * Camada de dados.
 * - Produção (Vercel): Upstash Redis, conectado pelo Marketplace da Vercel (plano grátis).
 * - Desenvolvimento local sem as variáveis: memória (some ao reiniciar).
 */
export interface DB {
  read(): Promise<LibraryResponse>;
  version(): Promise<number>;
  upsertLink(l: LinkItem): Promise<number>;
  deleteLink(id: string): Promise<number>;
  upsertCollection(c: Collection): Promise<number>;
  deleteCollection(id: string): Promise<number>;
  replace(lib: Library): Promise<number>;
}

const K = {
  links: 'linkfounder:links',
  cols: 'linkfounder:collections',
  ver: 'linkfounder:version',
  seeded: 'linkfounder:seeded',
};

const byOrder = (a: Collection, b: Collection) => (a.order ?? 0) - (b.order ?? 0);

class RedisDB implements DB {
  constructor(private r: Redis) {}

  private async seedOnce() {
    const first = await this.r.set(K.seeded, '1', { nx: true });
    if (first !== 'OK') return;
    const p = this.r.pipeline();
    p.hset(K.cols, Object.fromEntries(SEED.collections.map((c) => [c.id, c])));
    p.hset(K.links, Object.fromEntries(SEED.links.map((l) => [l.id, l])));
    p.incr(K.ver);
    await p.exec();
  }

  async read(): Promise<LibraryResponse> {
    await this.seedOnce();
    const [cols, links, ver] = await this.r
      .pipeline()
      .hgetall<Record<string, Collection>>(K.cols)
      .hgetall<Record<string, LinkItem>>(K.links)
      .get<number>(K.ver)
      .exec();
    return {
      collections: Object.values((cols ?? {}) as Record<string, Collection>).sort(byOrder),
      links: Object.values((links ?? {}) as Record<string, LinkItem>),
      version: Number(ver ?? 0),
    };
  }

  async version() {
    return Number((await this.r.get<number>(K.ver)) ?? 0);
  }

  async upsertLink(l: LinkItem) {
    await this.r.hset(K.links, { [l.id]: l });
    return this.r.incr(K.ver);
  }

  async deleteLink(id: string) {
    await this.r.hdel(K.links, id);
    return this.r.incr(K.ver);
  }

  async upsertCollection(c: Collection) {
    if (c.order === undefined) {
      const prev = await this.r.hget<Collection>(K.cols, c.id);
      c.order = prev?.order ?? Date.now();
    }
    await this.r.hset(K.cols, { [c.id]: c });
    return this.r.incr(K.ver);
  }

  async deleteCollection(id: string) {
    const links = ((await this.r.hgetall<Record<string, LinkItem>>(K.links)) ?? {}) as Record<string, LinkItem>;
    const doomed = Object.values(links).filter((l) => l.collection === id).map((l) => l.id);
    const p = this.r.pipeline();
    if (doomed.length) p.hdel(K.links, ...doomed);
    p.hdel(K.cols, id);
    p.incr(K.ver);
    const res = await p.exec();
    return Number(res[res.length - 1]);
  }

  async replace(lib: Library) {
    const p = this.r.pipeline();
    p.del(K.cols, K.links);
    if (lib.collections.length) p.hset(K.cols, Object.fromEntries(lib.collections.map((c) => [c.id, c])));
    if (lib.links.length) p.hset(K.links, Object.fromEntries(lib.links.map((l) => [l.id, l])));
    p.set(K.seeded, '1');
    p.incr(K.ver);
    const res = await p.exec();
    return Number(res[res.length - 1]);
  }
}

class MemoryDB implements DB {
  cols = new Map<string, Collection>(SEED.collections.map((c) => [c.id, structuredClone(c)]));
  links = new Map<string, LinkItem>(SEED.links.map((l) => [l.id, structuredClone(l)]));
  ver = 1;

  async read() {
    return {
      collections: [...this.cols.values()].sort(byOrder),
      links: [...this.links.values()],
      version: this.ver,
    };
  }
  async version() { return this.ver; }
  async upsertLink(l: LinkItem) { this.links.set(l.id, l); return ++this.ver; }
  async deleteLink(id: string) { this.links.delete(id); return ++this.ver; }
  async upsertCollection(c: Collection) {
    c.order ??= this.cols.get(c.id)?.order ?? Date.now();
    this.cols.set(c.id, c);
    return ++this.ver;
  }
  async deleteCollection(id: string) {
    for (const [k, l] of this.links) if (l.collection === id) this.links.delete(k);
    this.cols.delete(id);
    return ++this.ver;
  }
  async replace(lib: Library) {
    this.cols = new Map(lib.collections.map((c) => [c.id, c]));
    this.links = new Map(lib.links.map((l) => [l.id, l]));
    return ++this.ver;
  }
}

export class ConfigError extends Error {}

let instance: DB | undefined;

export function getDB(): DB {
  if (instance) return instance;
  // A integração Upstash da Vercel pode criar qualquer um destes pares de variáveis
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    instance = new RedisDB(new Redis({ url, token }));
  } else if (process.env.VERCEL) {
    throw new ConfigError('Banco de dados não conectado. Adicione o Upstash Redis no painel da Vercel (Storage).');
  } else {
    instance = new MemoryDB();
  }
  return instance;
}
