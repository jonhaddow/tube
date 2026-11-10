# Tube

A YouTube for younger kids, without YouTube: only channels a grown-up has chosen, with no ads, no Shorts, no autoplay and no links out.

Kids browse channels and watch videos with no sign-in. Grown-ups sign in to add or remove channels, and new videos are fetched in the background.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team)
- Google sign-in ([Arctic](https://arcticjs.dev)) for the grown-ups' page
- Plain CSS, styled as a retro terminal
- [YouTube Data API](https://developers.google.com/youtube/v3) and YouTube's no-cookie embedded player
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Development

See [`docs/development.md`](docs/development.md) for running it locally, configuration and deploying.
