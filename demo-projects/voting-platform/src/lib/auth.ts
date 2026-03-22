import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface GuestLogEntry {
  firstSeen: string;
  lastSeen: string;
  apps: Array<{
    name: string;
    firstUsed: string;
    lastUsed: string;
    visits: number;
  }>;
  totalVisits: number;
}

export interface AuthUser {
  email: string;
  sub: string;
  country?: string;
}

/**
 * Verify a Cloudflare Access JWT and extract user info
 */
export async function verifyAccessJWT(
  token: string,
  teamDomain: string,
  aud: string
): Promise<AuthUser | null> {
  try {
    const JWKS = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: teamDomain,
      audience: aud,
    });
    return {
      email: payload.email as string,
      sub: payload.sub as string,
      country: payload.country as string | undefined,
    };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

/**
 * Log a guest authentication event to KV
 * Tracks which apps guests have used across all demo applications
 */
export async function logGuestAuth(email: string, appName: string, kv: KVNamespace): Promise<void> {
  const now = new Date().toISOString();

  try {
    const existing = await kv.get<GuestLogEntry>(email, 'json');

    if (!existing) {
      // New guest - create entry
      await kv.put(
        email,
        JSON.stringify({
          firstSeen: now,
          lastSeen: now,
          apps: [{ name: appName, firstUsed: now, lastUsed: now, visits: 1 }],
          totalVisits: 1,
        })
      );
    } else {
      // Returning guest - update entry
      const appIndex = existing.apps.findIndex(a => a.name === appName);

      if (appIndex === -1) {
        // First time using this specific app
        existing.apps.push({
          name: appName,
          firstUsed: now,
          lastUsed: now,
          visits: 1,
        });
      } else {
        // Returning to this app
        existing.apps[appIndex].lastUsed = now;
        existing.apps[appIndex].visits++;
      }

      existing.lastSeen = now;
      existing.totalVisits++;

      await kv.put(email, JSON.stringify(existing));
    }
  } catch (e) {
    // Don't fail the request if logging fails
    console.error('Failed to log guest auth:', e);
  }
}

/**
 * Extract email from Cloudflare Access JWT in request headers or cookies (for local dev)
 */
export async function getEmailFromRequest(
  request: Request,
  teamDomain: string,
  aud: string
): Promise<string | null> {
  // Check Cf-Access-Jwt-Assertion header first (set by Access on protected paths)
  let token = request.headers.get('Cf-Access-Jwt-Assertion');

  // If no header, check CF_Authorization cookie (user is authenticated but path isn't protected)
  if (!token) {
    const cookies = request.headers.get('Cookie') || '';
    const cfAuthMatch = cookies.match(/CF_Authorization=([^;]+)/);
    if (cfAuthMatch) {
      token = cfAuthMatch[1];
    }
  }

  if (!token) {
    return null;
  }

  // Parse JWT payload to check expiration and extract email
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[AUTH] Invalid JWT format');
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      console.log('[AUTH] JWT expired');
      return null;
    }

    return payload.email || null;
  } catch (e) {
    console.warn('[AUTH] Failed to parse JWT:', e);
    return null;
  }
}
