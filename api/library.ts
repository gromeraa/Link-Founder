import { getDB } from './_lib/db.js';
import { canEdit, json, route } from './_lib/http.js';
import { cleanLibrary } from './_lib/validate.js';

/**
 * GET /api/library[?v=N] — PÚBLICO: qualquer pessoa com o link pode ler.
 * Devolve a biblioteca (ou {unchanged:true} se a versão for a mesma)
 * e `canEdit`, que diz se o código enviado permite editar.
 */
export const GET = route(
  async (req) => {
    const db = getDB();
    const editable = canEdit(req);
    if (!editable && req.headers.get('authorization')) {
      await new Promise((r) => setTimeout(r, 400)); // código errado: freia tentativas
    }
    const v = new URL(req.url).searchParams.get('v');
    if (v !== null) {
      const current = await db.version();
      if (String(current) === v) return json({ unchanged: true, version: current, canEdit: editable });
    }
    return json({ ...(await db.read()), canEdit: editable });
  },
  { public: true },
);

/** PUT /api/library → substitui tudo (importar backup) */
export const PUT = route(async (req) => {
  const lib = cleanLibrary(await req.json());
  const version = await getDB().replace(lib);
  return json({ ok: true, version });
});
