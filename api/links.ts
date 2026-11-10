import { getDB } from './_lib/db.js';
import { idParam, json, route } from './_lib/http.js';
import { cleanLink } from './_lib/validate.js';

/** POST /api/links → cria ou atualiza um link */
export const POST = route(async (req) => {
  const link = cleanLink(await req.json());
  const version = await getDB().upsertLink(link);
  return json({ ok: true, version, link });
});

/** DELETE /api/links?id=... */
export const DELETE = route(async (req) => {
  const version = await getDB().deleteLink(idParam(req));
  return json({ ok: true, version });
});
