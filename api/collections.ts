import { getDB } from './_lib/db.js';
import { idParam, json, route } from './_lib/http.js';
import { cleanCollection } from './_lib/validate.js';

/** POST /api/collections → cria ou atualiza uma coleção */
export const POST = route(async (req) => {
  const c = cleanCollection(await req.json());
  const version = await getDB().upsertCollection(c);
  return json({ ok: true, version, collection: c });
});

/** DELETE /api/collections?id=... → apaga a coleção e os links dela */
export const DELETE = route(async (req) => {
  const version = await getDB().deleteCollection(idParam(req));
  return json({ ok: true, version });
});
