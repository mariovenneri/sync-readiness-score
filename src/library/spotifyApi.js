// src/library/spotifyApi.js
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_ID || "";
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_SECRET || "";

// Get access token (required for all calls)
async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET)
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    console.error("Spotify token failed");
    return null;
  }

  const data = await response.json();
  return data.access_token;
}

export async function searchTracks(query) {
  if (!query.trim()) return [];

  const token = await getAccessToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: { Authorization: "Bearer " + token }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      artwork: track.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error("Spotify search failed:", error);
    return [];
  }
}

// Get similar tracks (recommendations)
export async function getSimilarTracks(artist, title, limit = 6) {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    // Find track ID
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(title)} artist:${encodeURIComponent(artist)}&type=track&limit=1`,
      { headers: { Authorization: "Bearer " + token } }
    );

    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    const trackId = searchData.tracks.items[0]?.id;
    if (!trackId) return [];

    // Get recommendations
    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=${limit}`,
      { headers: { Authorization: "Bearer " + token } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.tracks.map(t => ({
      title: t.name,
      artist: t.artists[0].name,
      artwork: t.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error("Spotify recommendations failed:", error);
    return [];
  }
}

// Fake audio features (real ones require user login)
export async function getAudioFeatures(trackId) {
  await new Promise(resolve => setTimeout(resolve, 800)); // simulate delay

  return {
    bpm: 100 + Math.floor(Math.random() * 60),
    key: Math.floor(Math.random() * 12),
    mode: Math.random() > 0.5 ? 1 : 0,
    energy: 0.5 + Math.random() * 0.4,
    valence: 0.4 + Math.random() * 0.5,
    danceability: 0.6 + Math.random() * 0.3,
    duration_ms: 150000 + Math.floor(Math.random() * 120000)
  };
}