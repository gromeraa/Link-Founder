import { changePassword, login } from './_lib/auth.js';
import { json, route } from './_lib/http.js';

/** GET /api/auth → quem está logado ({ user } ou { user: null }) */
export const GET = route(async (_req, user) => json({ user }), { public: true });

/**
 * POST /api/auth?action=login     { email, password }        → { token, user }
 * POST /api/auth?action=password  { current, next } (logado) → { token }
 */
export const POST = route(
  async (req, user) => {
    const action = new URL(req.url).searchParams.get('action');
    const body = (await req.json()) as Record<string, string>;
    if (action === 'login') {
      return json(await login(body.email, body.password));
    }
    if (action === 'password') {
      if (!user) return json({ error: 'Entre na sua conta primeiro.' }, 401);
      return json({ token: await changePassword(user, String(body.current ?? ''), String(body.next ?? '')) });
    }
    return json({ error: 'Ação desconhecida' }, 400);
  },
  { public: true },
);
