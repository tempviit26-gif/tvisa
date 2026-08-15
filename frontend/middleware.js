/**
 * Next.js Edge Middleware — Rate Limiter for Auth Routes
 *
 * Protects /api/auth/[...nextauth] (NextAuth internal endpoints) from
 * brute-force and credential-stuffing attacks at the edge, before any
 * page or API handler runs.
 *
 * Strategy: In-memory sliding-window counter per IP address.
 *
 * NOTE: This in-memory store is per-instance. It works correctly for
 * single-instance deployments (Railway, single Vercel region). For
 * multi-instance / multi-region deployments, replace with a shared
 * KV store (e.g., Vercel KV / Upstash Redis).
 */

import { NextResponse } from 'next/server';

// ─── Config ──────────────────────────────────────────────────────────────────

/** Routes that should be rate-limited */
const RATE_LIMITED_PATHS = ['/api/auth'];

/** Maximum requests allowed within the window */
const MAX_REQUESTS = 10;

/** Sliding window duration in milliseconds */
const WINDOW_MS = 60 * 1000; // 60 seconds

// ─── In-memory store ─────────────────────────────────────────────────────────

/**
 * Map<ip, { count: number, windowStart: number }>
 * Automatically cleaned up on each request to avoid unbounded growth.
 */
const ipStore = new Map();

/** Clean up entries older than 2× the window to limit memory usage */
function pruneStore() {
    const now = Date.now();
    for (const [key, entry] of ipStore.entries()) {
        if (now - entry.windowStart > WINDOW_MS * 2) {
            ipStore.delete(key);
        }
    }
}

// ─── IP extraction ────────────────────────────────────────────────────────────

/**
 * Extract the real client IP from request headers.
 * Handles proxies (Vercel, Railway, Nginx) that forward the original IP.
 */
function getClientIp(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // x-forwarded-for can be "client, proxy1, proxy2" — take the first
        return forwarded.split(',')[0].trim();
    }
    return (
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') || // Cloudflare
        'unknown'
    );
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Only apply to rate-limited paths
    const isRateLimited = RATE_LIMITED_PATHS.some((path) =>
        pathname.startsWith(path)
    );

    if (!isRateLimited) {
        return NextResponse.next();
    }

    // Skip GET requests to NextAuth (e.g. session fetches, CSRF token)
    // Only throttle POST (sign-in attempts, callbacks)
    if (request.method === 'GET') {
        return NextResponse.next();
    }

    const ip = getClientIp(request);
    const now = Date.now();

    // Prune old entries periodically
    pruneStore();

    const entry = ipStore.get(ip);

    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        // New window — reset counter
        ipStore.set(ip, { count: 1, windowStart: now });
        return NextResponse.next();
    }

    if (entry.count >= MAX_REQUESTS) {
        // Rate limit exceeded
        const retryAfterSeconds = Math.ceil(
            (WINDOW_MS - (now - entry.windowStart)) / 1000
        );

        return new NextResponse(
            JSON.stringify({
                error: 'Too many requests. Please wait before trying again.',
                retryAfter: retryAfterSeconds,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(retryAfterSeconds),
                    'X-RateLimit-Limit': String(MAX_REQUESTS),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(
                        Math.ceil((entry.windowStart + WINDOW_MS) / 1000)
                    ),
                },
            }
        );
    }

    // Increment the counter within the current window
    entry.count += 1;
    ipStore.set(ip, entry);

    const response = NextResponse.next();
    // Expose rate limit headers to the client for transparency
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    response.headers.set(
        'X-RateLimit-Remaining',
        String(MAX_REQUESTS - entry.count)
    );
    response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil((entry.windowStart + WINDOW_MS) / 1000))
    );

    return response;
}

// ─── Matcher ─────────────────────────────────────────────────────────────────

export const config = {
    matcher: [
        /*
         * Match /api/auth routes only.
         * Exclude static files, images, and favicon.
         */
        '/api/auth/:path*',
    ],
};
