export interface Env {
  DB: D1Database;
}

function generateId(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getUserFromEmail(
  env: Env,
  email: string
): Promise<{ id: string; email: string } | null> {
  const normalizedEmail = email.toLowerCase();
  const existing = await env.DB.prepare('SELECT id, email FROM users WHERE LOWER(email) = ?')
    .bind(normalizedEmail)
    .first<{ id: string; email: string }>();
  return existing || null;
}

async function ensureUser(env: Env, email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase();
  let user = await getUserFromEmail(env, email);
  if (user) {
    return user.id;
  }
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id, email) VALUES (?, ?)')
    .bind(id, normalizedEmail)
    .run();
  return id;
}

function getUserIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = cookie.match(/user_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setUserCookie(userId: string): string {
  return `user_id=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}

export { generateId, ensureUser, getUserIdFromRequest, setUserCookie };
