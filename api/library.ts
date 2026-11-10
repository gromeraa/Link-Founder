import { getDB } from './_lib/db.js';
import { json, route } from './_lib/http.js';
import { cleanLibrary } from './_lib/validate.js';

/** GET /api/library[?v=N] → biblioteca completa (ou {unchanged:true} se a versão for a mesma) */
export const GET = route(async (req) => {
  const db = getDB();
  const v = new URL(req.url).searchParams.get('v');
  if (v !== null) {
    const current = await db.version();
    if (String(current) === v) return json({ unchanged: true, version: current });
  }
  return json(await db.read());
});

/** PUT /api/library → substitui tudo (importar backup) */
export const PUT = route(async (req) => {
  const lib = cleanLibrary(await req.json());
  const version = await getDB().replace(lib);
  return json({ ok: true, version });
});
