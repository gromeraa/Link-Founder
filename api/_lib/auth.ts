import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { ConfigError, getDB } from './db.js';

/**
 * Login com e-mail e senha
 * ------------------------
 * As contas são definidas na variável de ambiente LOGIN_USERS da Vercel:
 *
 *   LOGIN_USERS = Gui:gui@exemplo.com:senha-inicial;Ana:ana@exemplo.com:outra-senha
 *
 * (nome:e-mail:senha, contas separadas por ponto e vírgula; a senha não pode ter ";").
 * Depois de entrar, cada pessoa pode trocar a senha pelo app: a nova senha fica guardada
 * com hash (scrypt) no banco e passa a valer no lugar da senha inicial.
 */

export interface User {
  name: string;
  email: string;
}

interface Account extends User {
  initialPassword: string;
}

const SESSION_DAYS = 180;

export function accounts(): Account[] {
  const raw = process.env.LOGIN_USERS ?? '';
  return raw
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, email, ...rest] = entry.split(':');
      return { name: (name ?? '').trim(), email: (email ?? '').trim().toLowerCase(), initialPassword: rest.join(':') };
    })
    .filter((a) => a.name && a.email.includes('@') && a.initialPassword);
}

/** Sem contas configuradas e fora da Vercel = desenvolvimento local, edição liberada. */
export const devOpen = () => !process.env.VERCEL && accounts().length === 0;

const sha = (s: string) => createHash('sha256').update(s).digest();
const safeEq = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

function secret() {
  // derivado das próprias contas + token do banco: trocar LOGIN_USERS derruba as sessões antigas
  return sha(`${process.env.SESSION_SECRET ?? ''}|${process.env.LOGIN_USERS ?? ''}|${process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''}`);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(password, salt, 32).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

function checkHash(password: string, stored: string) {
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 32);
  const real = Buffer.from(hash, 'base64url');
  return test.length === real.length && timingSafeEqual(test, real);
}

/** Impressão digital da credencial atual: muda quando a senha muda (invalida sessões antigas). */
async function credentialStamp(acc: Account) {
  const stored = await getDB().kvGet(`pw:${acc.email}`);
  return sha(stored ?? `initial:${acc.initialPassword}`).toString('base64url').slice(0, 12);
}

async function sign(user: User, stamp: string) {
  const payload = Buffer.from(
    JSON.stringify({ e: user.email, n: user.name, s: stamp, x: Date.now() + SESSION_DAYS * 86400_000 }),
  ).toString('base64url');
  const mac = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

/** Lê o token do cabeçalho Authorization e devolve o usuário, se for válido. */
export async function sessionUser(req: Request): Promise<User | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  if (!safeEq(mac, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { e: string; n: string; s: string; x: number };
    if (Date.now() > data.x) return null;
    const acc = accounts().find((a) => a.email === data.e);
    if (!acc) return null; // conta removida de LOGIN_USERS
    if ((await credentialStamp(acc)) !== data.s) return null; // senha trocada depois deste login
    return { name: acc.name, email: acc.email };
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
  }
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(emailRaw: string, password: string): Promise<{ token: string; user: User }> {
  const email = String(emailRaw ?? '').trim().toLowerCase();
  const db = getDB();
  if (accounts().length === 0) {
    throw new ConfigError('LOGIN_USERS não definida (ou em formato inválido) nas variáveis de ambiente da Vercel.');
  }
  const attempts = await db.hit(`login:${email}`, 15 * 60);
  if (attempts > 8) throw new AuthError('Muitas tentativas. Espere 15 minutos e tente de novo.', 429);

  const acc = accounts().find((a) => a.email === email);
  const stored = acc ? await db.kvGet(`pw:${acc.email}`) : null;
  const ok = !!acc && (stored ? checkHash(String(password ?? ''), stored) : safeEq(String(password ?? ''), acc.initialPassword));
  if (!ok || !acc) {
    await pause(500);
    throw new AuthError('E-mail ou senha incorretos.');
  }
  await db.clearHits(`login:${email}`);
  const user = { name: acc.name, email: acc.email };
  return { token: await sign(user, await credentialStamp(acc)), user };
}

export async function changePassword(user: User, current: string, next: string) {
  const acc = accounts().find((a) => a.email === user.email);
  if (!acc) throw new AuthError('Conta não encontrada.');
  const db = getDB();
  const stored = await db.kvGet(`pw:${acc.email}`);
  const ok = stored ? checkHash(current, stored) : safeEq(current, acc.initialPassword);
  if (!ok) {
    await pause(500);
    throw new AuthError('Senha atual incorreta.', 400);
  }
  if (next.length < 8) throw new AuthError('A nova senha precisa ter pelo menos 8 caracteres.', 400);
  await db.kvSet(`pw:${acc.email}`, hashPassword(next));
  // devolve um token novo: as outras sessões dessa conta deixam de valer
  return sign(user, await credentialStamp(acc));
}
