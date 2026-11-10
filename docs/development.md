# Development

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
- `YOUTUBE_API_KEY`: a YouTube Data API v3 key.
