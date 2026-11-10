import { error, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { env, waitUntil } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '#lib/server/db/schema.ts';
import { SESSION_COOKIE, setSessionCookie, validateSession } from '#lib/server/auth.ts';
import { syncIfDue } from '#lib/server/channels.ts';
import { youtube } from '#lib/server/youtube-client.ts';

/**
 * Pages that need a grown-up's sign-in. Everything else is the kids' side, open
 * to anyone: it only shows the allowed channels and never writes anything.
 */
const PRIVATE = [/^\/parent(\/|$)/, /^\/logout$/];

/** Sent with every page and endpoint (the CSP itself is configured in vite.config.ts). */
const SECURITY_HEADERS = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'same-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export const handle: Handle = async ({ event, resolve }) => {
	const db = drizzle(env.DB, { schema });
	event.locals.db = db;
	event.locals.user = null;

	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const result = await validateSession(db, token);
		if (result) {
			event.locals.user = result.user;
			if (result.renewed) setSessionCookie(event.cookies, token, result.expiresAt);
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const path = event.url.pathname;
	if (!event.locals.user && PRIVATE.some((p) => p.test(path))) {
		if (event.request.method !== 'GET') error(401, 'Please sign in');
		redirect(303, `/login?next=${encodeURIComponent(path + event.url.search)}`);
	}

	const response = await resolve(event);
	// Fetch videos in the background after a visit, at most every 10 minutes.
	if (event.request.method === 'GET' && !path.startsWith('/auth/'))
		waitUntil(syncIfDue(db, youtube()).catch((e: unknown) => console.error('Sync failed', e)));
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	// Pages name this build's files, which the next deploy deletes. Without this,
	// iOS reopens the home-screen app from a cached page whose CSS and JS are gone.
	if (response.headers.get('content-type')?.startsWith('text/html'))
		response.headers.set('Cache-Control', 'no-store');
	return response;
};
