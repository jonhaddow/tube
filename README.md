# Tube

A YouTube for younger kids, without YouTube: only channels a grown-up has chosen, with no ads, no Shorts, no autoplay and no links out.

Kids browse channels and watch videos with no sign-in. Grown-ups sign in to add or remove channels, and new videos are fetched in the background.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team)
- Google sign-in (OAuth with PKCE, shared code in [`auth`](https://github.com/jonhaddow/auth)) for the grown-ups' page
- Plain CSS, styled as a retro terminal
- [YouTube Data API](https://developers.google.com/youtube/v3) and YouTube's no-cookie embedded player
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute tube --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars   # add YOUTUBE_API_KEY for real channels; without it they're made up
npm run dev    # the login page has dev-only "Sign in as" buttons
```

Without `YOUTUBE_API_KEY` in `.dev.vars`, it shows made-up channels.

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check` (types), `npm run lint`.
