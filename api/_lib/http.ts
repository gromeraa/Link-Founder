import { timingSafeEqual, createHash } from 'node:crypto';
import { BadRequest } from './validate.js';
import { ConfigError } from './db.js';

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const digest = (s: string) => createHash('sha256').update(s).digest();

/**
 * Código de acesso de quem pode editar (variável ACCESS_CODE na Vercel).
 * Ler é público; criar, editar e apagar exige o código no cabeçalho
 * Authorization: Bearer <código>.
 */
export function canEdit(req: Request): boolean {
  const code = process.env.ACCESS_CODE;
  if (!code) return !process.env.VERCEL; // desenvolvimento local sem código: liberado
  const sent = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  return !!sent && timingSafeEqual(digest(sent), digest(code));
}

async function authorize(req: Request): Promise<Response | null> {
  if (!process.env.ACCESS_CODE && process.env.VERCEL) {
    return json({ error: 'Defina a variável ACCESS_CODE no painel da Vercel.' }, 500);
  }
  if (canEdit(req)) return null;
  await new Promise((r) => setTimeout(r, 400)); // freia tentativas de adivinhação
  return json({ error: 'Código de acesso incorreto.' }, 401);
}

/**
 * Envolve um handler com erros padronizados.
 * Por padrão exige o código (escrita); `{ public: true }` libera a leitura para qualquer pessoa.
 */
export function route(fn: (req: Request) => Promise<Response>, opts: { public?: boolean } = {}) {
  return async (req: Request) => {
    try {
      if (!opts.public) {
        const denied = await authorize(req);
        if (denied) return denied;
      }
      return await fn(req);
    } catch (e) {
      if (e instanceof BadRequest) return json({ error: e.message }, 400);
      if (e instanceof ConfigError) return json({ error: e.message }, 500);
      if (e instanceof SyntaxError) return json({ error: 'JSON inválido' }, 400);
      console.error(e);
      return json({ error: 'Erro no servidor' }, 500);
    }
  };
}

export const idParam = (req: Request) => {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new BadRequest('id inválido');
  return id;
};
