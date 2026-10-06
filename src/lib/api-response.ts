// ============================================================================
// SANCHIVA — Standardised API response + error helpers
// ----------------------------------------------------------------------------
// Every API route returns a consistent envelope:
//   { ok: boolean, data?: T, error?: { code: string, message: string } }
// This makes the client-side fetcher trivial and gives us a single choke
// point for error shapes.
// ============================================================================

import { NextResponse } from "next/server";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiFailure>(
    { ok: false, error: { code, message } },
    { status }
  );
}

// Map a thrown error to a JSON response. Use inside route handlers:
//   try { ... } catch (e) { return handleError(e) }
export function handleError(e: unknown) {
  const err = e as Error & { status?: number; code?: string };
  const status = err.status ?? 500;
  const code = err.code ?? (status === 401 ? "UNAUTHORIZED" : "INTERNAL");
  const message = err.message || "Something went wrong.";
  if (status === 500) console.error("[Sanchiva API] ", err);
  return fail(code, message, status);
}

// Helper to throw a typed API error from inside route logic.
export function apiError(code: string, message: string, status = 400): never {
  const e = new Error(message) as Error & { status: number; code: string };
  e.status = status;
  e.code = code;
  throw e;
}
