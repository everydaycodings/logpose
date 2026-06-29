# Jolly 🏴‍☠️

A calm, personal music streaming app — a private Spotify-style player for a
hand-curated collection. Add songs by uploading files or pasting a YouTube
link; Jolly extracts the audio, cover art, and details for you. Subtly themed
around the Straw Hat pirates, off-white and unhurried.

## Features

- **Full player** — play/pause, seek, volume, queue, shuffle, repeat,
  crossfade/gapless (Web Audio), a frequency visualizer, lyrics, and lock-screen
  controls (Media Session). Persistent bottom bar that expands to a full
  now-playing view.
- **Import** — drag-drop audio files or paste a YouTube link. Background worker
  (yt-dlp + FFmpeg) downloads, transcodes to MP3, and enriches metadata from
  MusicBrainz + Cover Art Archive, with live progress.
- **Library** — playlists, liked songs, and auto-generated album/artist pages,
  plus search with sort/filter.
- **Private** — single secret-password gate (no accounts), brute-force
  protection, and API rate limiting.
- **Themes** — Logbook, Grand Line, Wanted Poster, and Below Deck (dark).
- **Installable PWA** with background audio.

## Tech

Next.js 16 (App Router) · React 19 · Tailwind v4 + shadcn/ui · Postgres +
Prisma 7 · MinIO (S3) · Redis + BullMQ · yt-dlp + FFmpeg.

## Local development

Start the backing services (Postgres, Redis, MinIO) and run the app on your host:

```bash
cd local_setup && docker compose up -d && cd ..
cp .env.example .env        # then edit APP_PASSWORD / COOKIE_SECRET
npm install
npm run db:migrate          # first time only
npm run dev                 # http://localhost:3000  (terminal 1)
npm run worker:dev          # import worker          (terminal 2)
```

Log in with `APP_PASSWORD` (default `straw-hat` in the example env). See
[local_setup/README.md](local_setup/README.md) for details.

## Production (self-hosted)

The full stack — app, worker, Postgres, Redis, MinIO — runs from one compose file:

```bash
cp .env.example .env        # set APP_PASSWORD, COOKIE_SECRET, S3_PUBLIC_URL
docker compose up --build -d
```

Migrations run automatically on startup. Put a reverse proxy (e.g. Caddy) in
front for HTTPS, and set `S3_PUBLIC_URL` to the host the browser uses for media.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run worker:dev` | Import worker (watch mode) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` / `npm run typecheck` | Lint / type-check |
