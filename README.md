# Tube

The kids' YouTube, without YouTube: only the channels we've chosen, no ads, no Shorts and no links out. A web app for the kids' iPads.

- The kids' side needs no sign-in: channels, then a channel's videos (newest first), then the player.
- The player is YouTube's no-cookie embed with its controls hidden under a shield, driven by the app's own buttons. When a video ends it goes back to the channel: no autoplay.
- Grown-ups sign in with Google at `/parent` to add channels (a link, an @handle or a name to search) and remove them.
- Visits fetch videos from the YouTube Data API in the background, at most every 10 minutes: the newest every 6 hours, and older ones a few pages at a time until it has the whole channel.

Stack: SvelteKit (Svelte 5) on Cloudflare Workers, Drizzle ORM on Cloudflare D1, Vitest and Playwright.

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute tube --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars   # add YOUTUBE_API_KEY for real channels; without it they're made up
npm run dev    # the login page has dev-only "Sign in as" buttons
```

Tests: `npm test` (unit), `npm run test:e2e` (Playwright, always with made-up channels), `npm run check` (types), `npm run lint`.

## Installing on an iPad

Open the app in Safari, then Share → Add to Home Screen.

## Configuration

Vars in `wrangler.jsonc`: `GOOGLE_CLIENT_ID`.

Secrets (`wrangler secret put`):

- `GOOGLE_CLIENT_SECRET`
- `YOUTUBE_API_KEY`: a YouTube Data API v3 key (Stash's).
