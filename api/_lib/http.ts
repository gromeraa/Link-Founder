import { BadRequest } from './validate.js';
import { ConfigError } from './db.js';
import { AuthError, devOpen, sessionUser, type User } from './auth.js';

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const DEV_USER: User = { name: 'Dev', email: 'dev@local' };

/** Usuário logado (ou o usuário de desenvolvimento quando não há contas configuradas localmente). */
export async function currentUser(req: Request): Promise<User | null> {
  if (devOpen()) return DEV_USER;
  return sessionUser(req);
}

type Handler = (req: Request, user: User | null) => Promise<Response>;

/**
 * Envolve um handler com erros padronizados.
 * Por padrão exige login (escrita). `{ public: true }` libera para qualquer pessoa.
 */
export function route(fn: Handler, opts: { public?: boolean } = {}) {
  return async (req: Request) => {
    try {
      const user = await currentUser(req);
      if (!opts.public && !user) {
        return json({ error: 'Entre com seu e-mail e senha para editar.' }, 401);
      }
      return await fn(req, user);
    } catch (e) {
      if (e instanceof AuthError) return json({ error: e.message }, e.status);
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
