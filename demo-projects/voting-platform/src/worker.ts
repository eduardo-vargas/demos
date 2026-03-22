import { Hono } from 'hono';
import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { ensureUser } from './lib/api-utils';
import { logGuestAuth, getEmailFromRequest } from './lib/auth';

export interface Env {
  DB: D1Database;
  GUEST_LOGBOOK: KVNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  APP_NAME: string;
  CF_ACCESS_TEAM_DOMAIN: string;
  CF_ACCESS_AUD: string;
}

interface MeetingRow {
  id: string;
  short_code: string;
  name: string;
  description: string | null;
  status: string;
  creator_id: string;
  created_at: number;
  user_role: string | null;
}

interface QuestionRow {
  id: number;
  meeting_id: string;
  author_id: string;
  author_email: string;
  content: string;
  created_at: number;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
}

const app = new Hono();

async function requireAuth(c: any, env: Env): Promise<string | null> {
  const email = await getEmailFromRequest(c.req.raw, env.CF_ACCESS_TEAM_DOMAIN, env.CF_ACCESS_AUD);
  if (!email) {
    c.status(401);
    return c.json({ error: 'Authentication required' });
  }
  return email;
}

async function generateUniqueShortCode(db: D1Database): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let attempts = 0;

  while (attempts < 10) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await db
      .prepare('SELECT id FROM meetings WHERE short_code = ?')
      .bind(code)
      .first();
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique code');
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ==================== AUTH ENDPOINTS ====================

app.get('/auth/me', async c => {
  const env = c.env as Env;
  const email = await getEmailFromRequest(c.req.raw, env.CF_ACCESS_TEAM_DOMAIN, env.CF_ACCESS_AUD);

  if (!email) {
    return json({ authenticated: false });
  }

  try {
    await logGuestAuth(email, env.APP_NAME, env.GUEST_LOGBOOK);
    await ensureUser(env, email);
  } catch {
    // Don't fail the request if logging fails
  }

  return json({ authenticated: true, email });
});

app.get('/auth/login', async c => {
  const env = c.env as Env;
  const domain = new URL(c.req.url).host;
  const redirectUrl = '/auth';
  const loginUrl = `${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/login/${domain}?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return new Response(null, {
    status: 302,
    headers: { Location: loginUrl },
  });
});

app.get('/auth/logout', async c => {
  const env = c.env as Env;
  return new Response(null, {
    status: 302,
    headers: { Location: `${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/logout` },
  });
});

app.get('/user/meetings', async c => {
  const env = c.env as Env;
  const email = await requireAuth(c, env);
  if (!email) return;

  const userId = await ensureUser(env, email);

  const meetings = await env.DB.prepare(
    `
    SELECT 
      m.id, m.short_code, m.name, m.description, m.status, m.created_at,
      mm.role as user_role
    FROM meetings m
    LEFT JOIN meeting_members mm ON m.id = mm.meeting_id AND mm.user_id = ?
    WHERE m.creator_id = ? OR mm.user_id = ?
    ORDER BY m.created_at DESC
  `
  )
    .bind(userId, userId, userId)
    .all<MeetingRow>();

  return json(meetings.results || []);
});

// ==================== MEETINGS ENDPOINTS ====================

app.post('/meetings', async c => {
  const env = c.env as Env;
  const email = await requireAuth(c, env);
  if (!email) return;

  const { name, description, action } = await c.req.json<{
    name?: string;
    description?: string;
    action?: string;
  }>();

  const userId = await ensureUser(env, email);

  if (action === 'join') {
    const shortCode = name?.toUpperCase();
    if (!shortCode) {
      c.status(400);
      return c.json({ error: 'Meeting code required' });
    }

    const meeting = await env.DB.prepare(
      'SELECT id, name, description, status, creator_id, created_at FROM meetings WHERE short_code = ?'
    )
      .bind(shortCode)
      .first<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        creator_id: string;
        created_at: number;
      }>();

    if (!meeting) {
      c.status(404);
      return c.json({ error: 'Meeting not found with that code' });
    }

    const existingMember = await env.DB.prepare(
      'SELECT 1 FROM meeting_members WHERE meeting_id = ? AND user_id = ?'
    )
      .bind(meeting.id, userId)
      .first();

    if (!existingMember) {
      await env.DB.prepare(
        'INSERT INTO meeting_members (meeting_id, user_id, role) VALUES (?, ?, ?)'
      )
        .bind(meeting.id, userId, 'Member')
        .run();
    }

    return json({ ...meeting, short_code: shortCode, user_role: 'Member' });
  }

  if (!name) {
    c.status(400);
    return c.json({ error: 'Meeting name required' });
  }

  const shortCode = await generateUniqueShortCode(env.DB);
  const meetingId = crypto.randomUUID();

  await env.DB.prepare(
    `
    INSERT INTO meetings (id, short_code, name, description, status, creator_id)
    VALUES (?, ?, ?, ?, 'Active', ?)
  `
  )
    .bind(meetingId, shortCode, name, description || null, userId)
    .run();

  await env.DB.prepare('INSERT INTO meeting_members (meeting_id, user_id, role) VALUES (?, ?, ?)')
    .bind(meetingId, userId, 'Owner')
    .run();

  return json(
    {
      id: meetingId,
      short_code: shortCode,
      name,
      description,
      status: 'Active',
      creator_id: userId,
      user_role: 'Owner',
    },
    201
  );
});

app.get('/meetings/code/:code', async c => {
  const env = c.env as Env;
  const code = c.req.param('code')?.toUpperCase();

  if (!code) {
    c.status(400);
    return c.json({ error: 'Meeting code required' });
  }

  try {
    const meeting = await env.DB.prepare(
      'SELECT id, name, description, status, creator_id, created_at, short_code FROM meetings WHERE short_code = ?'
    )
      .bind(code)
      .first();

    if (!meeting) {
      c.status(404);
      return c.json({ error: 'Wrong meeting ID or that meeting no longer exists!' });
    }

    return json(meeting);
  } catch (e) {
    console.error('Database error:', e);
    c.status(404);
    return c.json({ error: 'Wrong meeting ID or that meeting no longer exists!' });
  }
});

app.get('/meetings/:id/owners', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');
  console.log('[GET /meetings/:id/owners] meetingId:', meetingId);

  await requireAuth(c, env);

  const creator = await env.DB.prepare('SELECT creator_id FROM meetings WHERE id = ?')
    .bind(meetingId)
    .first<{ creator_id: string }>();

  if (!creator) {
    c.status(404);
    return c.json({ error: 'Meeting not found' });
  }

  const owners = await env.DB.prepare(
    `
    SELECT u.id, u.email
    FROM users u
    JOIN meeting_members mm ON u.id = mm.user_id
    WHERE mm.meeting_id = ? AND mm.role = 'Owner'
    `
  )
    .bind(meetingId)
    .all<{ id: string; email: string }>();

  const result = (owners.results || []).map(owner => ({
    id: owner.id,
    email: owner.email,
    isCreator: owner.id === creator.creator_id,
  }));

  return json(result);
});

app.delete('/meetings/:id/owners/:ownerId', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');
  const ownerId = c.req.param('ownerId');

  const email = await requireAuth(c, env);
  if (!email) return;

  const userId = await ensureUser(env, email);

  const creator = await env.DB.prepare('SELECT creator_id FROM meetings WHERE id = ?')
    .bind(meetingId)
    .first<{ creator_id: string }>();

  if (!creator) {
    c.status(404);
    return c.json({ error: 'Meeting not found' });
  }

  if (creator.creator_id !== userId) {
    c.status(403);
    return c.json({ error: 'Forbidden: Only creator can remove owners' });
  }

  if (ownerId === creator.creator_id) {
    c.status(400);
    return c.json({ error: 'Cannot remove the creator from the meeting' });
  }

  await env.DB.prepare(
    `DELETE FROM meeting_members WHERE meeting_id = ? AND user_id = ? AND role = 'Owner'`
  )
    .bind(meetingId, ownerId)
    .run();

  return json({ success: true });
});

app.get('/meetings/:id', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');

  let email = '';
  try {
    const authResult = await requireAuth(c, env);
    email = authResult || '';
  } catch {
    // Allow viewing without auth
  }

  const meeting = await env.DB.prepare(
    `
    SELECT m.*, mm.role as user_role
    FROM meetings m
    LEFT JOIN meeting_members mm ON m.id = mm.meeting_id AND mm.user_id = (
      SELECT id FROM users WHERE email = ?
    )
    WHERE m.id = ? OR m.short_code = ?
  `
  )
    .bind(email, meetingId, meetingId)
    .first<MeetingRow>();

  if (!meeting) {
    c.status(404);
    return c.json({ error: 'Meeting not found' });
  }

  return json(meeting);
});

app.put('/meetings/:id', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');

  const email = await requireAuth(c, env);
  if (!email) return;

  const userId = await ensureUser(env, email);

  const member = await env.DB.prepare(
    'SELECT role FROM meeting_members WHERE meeting_id = ? AND user_id = ? AND role = ?'
  )
    .bind(meetingId, userId, 'Owner')
    .first<{ role: string }>();

  if (!member) {
    c.status(403);
    return c.json({ error: 'Forbidden: Only owners can edit' });
  }

  const { name, description, status } = await c.req.json<{
    name?: string;
    description?: string;
    status?: string;
  }>();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (status !== undefined) {
    if (!['Active', 'Closed'].includes(status)) {
      c.status(400);
      return c.json({ error: 'Invalid status' });
    }
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    c.status(400);
    return c.json({ error: 'No fields to update' });
  }

  values.push(meetingId);

  await env.DB.prepare(`UPDATE meetings SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const meeting = await env.DB.prepare('SELECT * FROM meetings WHERE id = ?')
    .bind(meetingId)
    .first<MeetingRow>();

  return json(meeting);
});

app.post('/meetings/:id/owners', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');

  const email = await requireAuth(c, env);
  if (!email) return;

  const userId = await ensureUser(env, email);

  const creator = await env.DB.prepare('SELECT creator_id FROM meetings WHERE id = ?')
    .bind(meetingId)
    .first<{ creator_id: string }>();

  if (!creator || creator.creator_id !== userId) {
    c.status(403);
    return c.json({ error: 'Forbidden: Only creator can add owners' });
  }

  const { ownerEmail } = await c.req.json<{ ownerEmail?: string }>();
  if (!ownerEmail) {
    c.status(400);
    return c.json({ error: 'ownerEmail required' });
  }

  const ownerId = await ensureUser(env, ownerEmail);

  await env.DB.prepare(
    `INSERT INTO meeting_members (meeting_id, user_id, role) VALUES (?, ?, 'Owner') ON CONFLICT(meeting_id, user_id) DO UPDATE SET role = 'Owner'`
  )
    .bind(meetingId, ownerId)
    .run();

  return json({ success: true });
});

// ==================== QUESTIONS ENDPOINTS ====================

app.get('/meetings/:id/questions', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');
  const search = c.req.query('search') || '';
  const sort = c.req.query('sort') || 'votes';

  let userId: string | null = null;
  try {
    const authResult = await requireAuth(c, env);
    if (authResult) userId = await ensureUser(env, authResult);
  } catch {
    // Allow viewing without auth
  }

  const meeting = await env.DB.prepare('SELECT id FROM meetings WHERE id = ? OR short_code = ?')
    .bind(meetingId, meetingId)
    .first<{ id: string }>();

  if (!meeting) {
    c.status(404);
    return c.json({ error: 'Meeting not found' });
  }

  let orderBy =
    "COALESCE(SUM(CASE WHEN v.type = 'up' THEN 1 ELSE 0 END), 0) DESC, q.created_at DESC";
  if (sort === 'newest') {
    orderBy = 'q.created_at DESC';
  } else if (sort === 'oldest') {
    orderBy = 'q.created_at ASC';
  }

  const params: (string | number)[] = [meeting.id];

  if (search) {
    params.push(`%${search}%`);
  }

  const questions = await env.DB.prepare(
    `
    SELECT 
      q.id, q.meeting_id, q.author_id, u.email as author_email, q.content, q.created_at,
      COALESCE(SUM(CASE WHEN v.type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
      COALESCE(SUM(CASE WHEN v.type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
      ${userId ? '(SELECT type FROM votes WHERE question_id = q.id AND user_id = ?)' : 'NULL'} as user_vote
    FROM questions q
    JOIN users u ON q.author_id = u.id
    LEFT JOIN votes v ON q.id = v.question_id
    WHERE q.meeting_id = ?
    GROUP BY q.id
    ORDER BY ${orderBy}
  `
  )
    .bind(...(userId ? [userId, ...params] : params))
    .all<QuestionRow>();

  return json(questions.results || []);
});

app.post('/meetings/:id/questions', async c => {
  const env = c.env as Env;
  const meetingId = c.req.param('id');

  const email = await requireAuth(c, env);
  if (!email) return;

  const userId = await ensureUser(env, email);
  const { content } = await c.req.json<{ content?: string }>();

  if (!content || content.trim().length === 0) {
    c.status(400);
    return c.json({ error: 'Content required' });
  }

  const meeting = await env.DB.prepare(
    'SELECT id, status FROM meetings WHERE id = ? OR short_code = ?'
  )
    .bind(meetingId, meetingId)
    .first<{ id: string; status: string }>();

  if (!meeting) {
    c.status(404);
    return c.json({ error: 'Meeting not found' });
  }

  if (meeting.status === 'Closed') {
    c.status(403);
    return c.json({ error: 'Cannot add questions to closed meeting' });
  }

  const member = await env.DB.prepare(
    'SELECT 1 FROM meeting_members WHERE meeting_id = ? AND user_id = ?'
  )
    .bind(meeting.id, userId)
    .first();

  if (!member) {
    await env.DB.prepare('INSERT INTO meeting_members (meeting_id, user_id, role) VALUES (?, ?, ?)')
      .bind(meeting.id, userId, 'Member')
      .run();
  }

  const result = await env.DB.prepare(
    'INSERT INTO questions (meeting_id, author_id, content) VALUES (?, ?, ?)'
  )
    .bind(meeting.id, userId, content.trim())
    .run();

  return json(
    {
      id: result.lastInsertRowid,
      meeting_id: meeting.id,
      author_id: userId,
      author_email: email,
      content: content.trim(),
      created_at: Math.floor(Date.now() / 1000),
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
    },
    201
  );
});

// ==================== VOTES ENDPOINT ====================

app.post('/questions/:id/vote', async c => {
  const env = c.env as Env;
  const questionId = parseInt(c.req.param('id'));

  const email = await requireAuth(c, env);
  if (!email) return;

  const userId = await ensureUser(env, email);
  const { type } = await c.req.json<{ type?: string }>();

  if (!['up', 'down'].includes(type || '')) {
    c.status(400);
    return c.json({ error: 'Invalid vote type' });
  }

  const question = await env.DB.prepare(
    `SELECT q.id, m.status FROM questions q JOIN meetings m ON q.meeting_id = m.id WHERE q.id = ?`
  )
    .bind(questionId)
    .first<{ id: number; status: string }>();

  if (!question) {
    c.status(404);
    return c.json({ error: 'Question not found' });
  }

  if (question.status === 'Closed') {
    c.status(403);
    return c.json({ error: 'Cannot vote on questions in closed meeting' });
  }

  const existingVote = await env.DB.prepare(
    'SELECT type FROM votes WHERE question_id = ? AND user_id = ?'
  )
    .bind(questionId, userId)
    .first<{ type: string }>();

  if (existingVote && existingVote.type === type) {
    await env.DB.prepare('DELETE FROM votes WHERE question_id = ? AND user_id = ?')
      .bind(questionId, userId)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO votes (question_id, user_id, type) VALUES (?, ?, ?) ON CONFLICT(question_id, user_id) DO UPDATE SET type = ?`
    )
      .bind(questionId, userId, type, type)
      .run();
  }

  const stats = await env.DB.prepare(
    `SELECT COALESCE(SUM(CASE WHEN type = 'up' THEN 1 ELSE 0 END), 0) as upvotes, COALESCE(SUM(CASE WHEN type = 'down' THEN 1 ELSE 0 END), 0) as downvotes FROM votes WHERE question_id = ?`
  )
    .bind(questionId)
    .first<{ upvotes: number; downvotes: number }>();

  return json({
    upvotes: stats?.upvotes || 0,
    downvotes: stats?.downvotes || 0,
    user_vote: existingVote?.type === type ? null : type,
  });
});

// ==================== ADMIN ENDPOINT ====================

app.get('/admin/meetings', async c => {
  const env = c.env as Env;

  const email = await requireAuth(c, env);
  if (!email) return;

  await ensureUser(env, email);

  const meetings = await env.DB.prepare(
    `
    SELECT 
      m.id, m.short_code, m.name, m.description, m.status, m.created_at,
      (SELECT COUNT(*) FROM meeting_members WHERE meeting_id = m.id) as member_count,
      (SELECT COUNT(*) FROM questions WHERE meeting_id = m.id) as question_count
    FROM meetings m
    ORDER BY m.created_at DESC
  `
  ).all<MeetingRow>();

  return json(meetings.results || []);
});

// ==================== WORKER ENTRY ====================

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle /api/* routes
    if (url.pathname.startsWith('/api/')) {
      const pathWithoutApi = url.pathname.replace('/api', '');
      console.log('[Worker] API request:', pathWithoutApi);
      const modifiedUrl = new URL(url.origin + pathWithoutApi + url.search);
      const modifiedRequest = new Request(modifiedUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: request.redirect,
      });
      return await app.fetch(modifiedRequest, env, ctx);
    }

    // Serve static assets first
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 200) {
        return assetResponse;
      }
    } catch {
      // Continue to SPA fallback
    }

    // SPA fallback
    try {
      const indexHtml = await env.ASSETS.fetch(new URL('/index.html', request.url));
      return indexHtml;
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  },
};

export default worker;
