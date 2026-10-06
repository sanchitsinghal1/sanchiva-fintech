// ============================================================================
// SANCHIVA — Auth & JWT utility layer
// ----------------------------------------------------------------------------
// Implements a JWT access + refresh token architecture:
//   - access token:  short-lived (15m), stateless, sent in Authorization header
//   - refresh token: long-lived (7d), stateful (stored in RefreshToken table),
//                    rotated on every refresh to mitigate replay attacks.
// Passwords are hashed with bcryptjs (cost 10). Never log or return the hash.
// ============================================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "sanchiva_dev_access_secret_change_me_in_production_32chars";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "sanchiva_dev_refresh_secret_change_me_in_production_32chars";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// Token payload
// ---------------------------------------------------------------------------
export type AccessTokenPayload = {
  sub: string; // user id
  email: string;
  role: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string; // refresh token db id
  type: "refresh";
};

export function signAccessToken(payload: { sub: string; email: string; role: string }): string {
  return jwt.sign({ ...payload, type: "access" } as AccessTokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

export function signRefreshToken(payload: { sub: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign({ ...payload, type: "refresh" } as RefreshTokenPayload, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRES,
    }, async (err, token) => {
      if (err || !token) return reject(err);
      try {
        // Persist the refresh token so we can rotate/revoke it.
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await db.refreshToken.create({
          data: { userId: payload.sub, token, expiresAt },
        });
        resolve(token);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rotate a refresh token: revoke the old, issue a new pair. Rejects if the
// stored token was already revoked (re-use detection).
// ---------------------------------------------------------------------------
export async function rotateRefreshToken(oldToken: string) {
  const stored = await db.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return null;
  }
  // Revoke old, mint new.
  await db.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const user = await db.user.findUnique({ where: { id: stored.userId } });
  if (!user) return null;

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = await signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken, user };
}

// ---------------------------------------------------------------------------
// Cookie helpers. Access token lives in an httpOnly cookie for the demo so
// the client never touches it directly (CSRF-safe, XSS-resistant). For
// stricter APIs you'd move the access token to a Bearer header instead.
// ---------------------------------------------------------------------------
const ACCESS_COOKIE = "sanchiva_access";
const REFRESH_COOKIE = "sanchiva_refresh";

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const c = await cookies();
  c.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15, // 15m
  });
  c.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7d
  });
}

export async function clearAuthCookies() {
  const c = await cookies();
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
}

export async function getAuthTokens(): Promise<{ access?: string; refresh?: string }> {
  const c = await cookies();
  return {
    access: c.get(ACCESS_COOKIE)?.value,
    refresh: c.get(REFRESH_COOKIE)?.value,
  };
}

// ---------------------------------------------------------------------------
// getUserFromRequest — the guard used by every protected API route.
// Returns the user row or null. If the access token is expired but a valid
// refresh token is present, it silently rotates and re-sets cookies.
// ---------------------------------------------------------------------------
export async function getUserFromRequest() {
  const { access, refresh } = await getAuthCookies();
  if (!access) return null;

  let payload = verifyAccessToken(access);
  if (!payload && refresh) {
    // Access token expired — try silent rotation.
    const rotated = await rotateRefreshToken(refresh);
    if (!rotated) return null;
    await setAuthCookies(rotated.accessToken, rotated.refreshToken);
    return rotated.user;
  }
  if (!payload) return null;

  const user = await db.user.findUnique({ where: { id: payload.sub } });
  return user;
}

export async function requireUser() {
  const user = await getUserFromRequest();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    (err as any).status = 401;
    throw err;
  }
  return user;
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
