// src/library/lastFMapi.js
const LASTFM_KEY = import.meta.env.VITE_LASTFM_KEY || "";
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

// iTunes search — fast and beautiful
export async function searchTracks(query) {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`
    );

    if (!response.ok) return [];

    const data = await response.json();

    return data.results.map(track => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      artwork: track.artworkUrl100?.replace("100x100", "300x300") || null
    }));
  } catch (error) {
    console.error("iTunes search failed:", error);
    return [];
  }
}

// Real Last.fm similar tracks
export async function getSimilarTracks(artist, title, limit = 6) {
  if (!LASTFM_KEY) {
    console.warn("No Last.fm key — similar tracks disabled");
    return [];
  }

  try {
    const url = `${LASTFM_BASE}?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&limit=${limit}&api_key=${LASTFM_KEY}&format=json`;

    const response = await fetch(url);

    if (!response.ok) return [];

    const data = await response.json();

    // Last.fm returns { similartracks: { track: [...] } }
    const tracks = data.similartracks?.track || [];

    return tracks.map(t => ({
      title: t.name,
      artist: t.artist.name,
      artwork: t.image?.[3]?.["#text"] || null // largest image
    }));
  } catch (error) {
    console.error("Last.fm similar tracks failed:", error);
    return [];
  }
}

// Optional: Get real track info (tags, wiki)
export async function getTrackInfo(artist, title) {
  if (!LASTFM_KEY) return null;

  try {
    const url = `${LASTFM_BASE}?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${LASTFM_KEY}&format=json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.track || null;
  } catch (error) {
    console.error("Last.fm track info failed:", error);
    return null;
  }
}