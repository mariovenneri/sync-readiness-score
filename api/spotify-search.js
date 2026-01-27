// api/spotify-search.js
export default async function handler(req, res) {
  console.log("=== SPOTIFY SEARCH CALLED ===");
  console.log("Query:", req.query.q);
  
  const { q } = req.query;

  if (!q) {
    console.log("ERROR: Missing query");
    return res.status(400).json({ error: "Missing query" });
  }

  console.log("Spotify Client ID exists:", !!process.env.SPOTIFY_CLIENT_ID);
  console.log("Spotify Client Secret exists:", !!process.env.SPOTIFY_CLIENT_SECRET);

  try {
    // Get Spotify token
    console.log("Getting Spotify access token...");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(
          `${process.env.VITE_SPOTIFY_ID}:${process.env.VITE_SPOTIFY_SECRET}`
        ).toString("base64")}`
      },
      body: "grant_type=client_credentials"
    });

    console.log("Token response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log("Token error:", errorText);
      throw new Error("Failed to get Spotify token");
    }

    const { access_token } = await tokenResponse.json();
    console.log("Access token received:", access_token ? "YES" : "NO");

    // Search Spotify
    console.log("Searching Spotify for:", q);
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`,
      { headers: { "Authorization": `Bearer ${access_token}` } }
    );

    console.log("Search response status:", searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log("Search error:", errorText);
      throw new Error("Spotify search failed");
    }

    const data = await searchResponse.json();
    console.log("Tracks found:", data.tracks?.items?.length || 0);

    // Return simplified tracks
    const tracks = data.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      artwork: track.album.images[0]?.url
    }));

    console.log("Returning tracks:", tracks.map(t => `${t.title} by ${t.artist}`));
    console.log("=== SPOTIFY SEARCH COMPLETE ===");

    return res.json({ tracks });

  } catch (error) {
    console.error("ERROR in Spotify search:", error);
    return res.status(500).json({ error: "Search failed", details: error.message });
  }
}