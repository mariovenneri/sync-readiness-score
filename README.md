# SyncCheck

Live at [synccheck.io](https://synccheck.io)

A commissioned React application built for the co-founders of MusicAtlas.ai. It analyzes a track and returns a breakdown of how ready that song is for sync licensing, meaning placement in TV, film, and advertising.

**Stack:** React, Vite, Tailwind CSS, three REST APIs (Spotify, MusicAtlas, Grok AI), deployed on Vercel

## What it does

1. Pulls track identity and audio metadata from the Spotify API
2. Runs the track through MusicAtlas for structural and musical analysis
3. Passes those results to Grok AI to generate a plain language breakdown
4. Renders everything as a single readable report for the musician

## What I built

**Integrating three APIs that do not agree with each other.** Each service returns a different response shape, identifies the same track differently, and fails differently. Most of the work was normalizing all three into one internal model before any of it reached the UI, and handling the case where one service returns something the other two do not recognize.

**Chained async requests.** The calls have to run in sequence, since MusicAtlas needs the Spotify identifier and Grok needs the MusicAtlas output. I managed loading and error states across the full chain so a failure at step two does not leave the interface hanging.

**Interface.** Built in React and Tailwind, with the report written to be readable by a musician rather than by a developer.

## Client work

Built on commission for the co-founders of MusicAtlas.ai and shipped to production.

## Running locally

```bash
npm install
npm run dev
```

Requires API keys for Spotify, MusicAtlas, and Grok in `.env`.

---

Built by Mario Venneri &middot; [nect.studio](https://nect.studio) &middot; [LinkedIn](https://www.linkedin.com/in/mario-venneri/)
