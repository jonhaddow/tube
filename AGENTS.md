# Tube

A YouTube for younger kids on iPads: only channels a grown-up has allowed, no ads, no Shorts. YouTube itself is blocked on their iPads, so links out of the player don't matter. A PWA at https://tube.app.haddow.me.

## Worth knowing

- The kids' side is public (no sign-in, read-only); only `/parent` and `/logout` need one (`PRIVATE` in `hooks.server.ts`).
- Videos come from the uploads-without-Shorts playlist (`UULF` + the channel id without `UC`), then `videos.list` to drop ones that can't be embedded, are live, or are blocked in the UK (`youtube.ts`). Thumbnails aren't stored: `i.ytimg.com/vi/<id>/hqdefault.jpg`.
- No cron: the free plan's five are taken by other apps. Instead any visit starts a sync in the background (`waitUntil` in `hooks.server.ts`), at most every 10 minutes (`syncIfDue`, claimed atomically in `sync_state`). It does 5 pages of 50, sharing the visit's CPU limit: the newest page of channels not checked for 6 hours, then older pages (`channel.olderPage`, null when done).
- The player (`Player.svelte`): YouTube's own controls, so full screen is the device's own (the iPhone's video player). We only listen to it (embed postMessage API) to keep the place and go back to the channel when it ends. A screen wake lock is held while it plays (iOS dims otherwise).
- Where each video was left is kept per device in localStorage (`positions.ts`), not D1: the player seeks there once it starts, and channel pages show a bar on part-watched thumbnails.
- Local dev and e2e use made-up channels (`fake-youtube.ts`) without `YOUTUBE_API_KEY`; e2e and `shot.sh` always do (`FAKE_YOUTUBE=1`).
- No Tailwind or shadcn: plain CSS in `app.css`. The look is a terminal (green on black, monospace, square corners) so it doesn't feel babyish.
- Secrets: `GOOGLE_CLIENT_SECRET`, `YOUTUBE_API_KEY` (YouTube Data API v3; the same key as stash).

## Review focus

Anything that could let a kid reach a video from a channel that isn't allowed. Workers CPU and subrequests in the sync, YouTube API quota (10,000 units a day; a search is 100).
