import { getDB } from './_lib/db.js';
import { json, route } from './_lib/http.js';
import { cleanLibrary } from './_lib/validate.js';

/**
 * GET /api/library[?v=N] — PÚBLICO: qualquer pessoa com o link pode ler.
 * Devolve a biblioteca (ou {unchanged:true} se a versão for a mesma)
 * e `canEdit`/`user`, conforme o login enviado.
 */
export const GET = route(
  async (req, user) => {
    const db = getDB();
    const meta = { canEdit: !!user, user };
    const v = new URL(req.url).searchParams.get('v');
    if (v !== null) {
      const current = await db.version();
      if (String(current) === v) return json({ unchanged: true, version: current, ...meta });
    }
    return json({ ...(await db.read()), ...meta });
  },
  { public: true },
);

/** PUT /api/library → substitui tudo (restaurar backup). Exige login. */
export const PUT = route(async (req) => {
  const lib = cleanLibrary(await req.json());
  const version = await getDB().replace(lib);
  return json({ ok: true, version });
});
