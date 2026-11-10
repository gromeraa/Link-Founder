import { getDB } from './_lib/db.js';
import { idParam, json, route } from './_lib/http.js';
import { cleanLink } from './_lib/validate.js';

/** POST /api/links → cria ou atualiza um link */
export const POST = route(async (req, user) => {
  const link = cleanLink(await req.json());
  const db = getDB();
  // o autor é definido pelo servidor: quem criou o link primeiro
  const existing = await db.getLink(link.id);
  const author = existing ? existing.addedBy : user?.name;
  if (author) link.addedBy = author;
  else delete link.addedBy;
  const version = await db.upsertLink(link);
  return json({ ok: true, version, link });
});

/** DELETE /api/links?id=... */
export const DELETE = route(async (req) => {
  const version = await getDB().deleteLink(idParam(req));
  return json({ ok: true, version });
});
