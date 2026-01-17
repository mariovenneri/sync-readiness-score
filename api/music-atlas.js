// api/music-atlas.js — Vercel serverless proxy (POST)

export default async function handler(req, res) {
  console.log("Proxy route hit – full URL:", req.url);
  console.log("Request method:", req.method);
  console.log("Raw body:", req.body); // Debug: see what Vercel receives

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, title } = req.body;

  console.log("Proxy received body:", req.body);

  if (!artist || !title) {
    return res.status(400).json({ error: "Missing artist or title" });
  }

  const encodedArtist = encodeURIComponent(artist);
  const encodedTitle = encodeURIComponent(title);

  const key = process.env.VITE_MUSICATLAS_KEY;

  if (!key) {
    console.error("MusicAtlas key not found in env");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // 1. Try describe_track first
    let response = await fetch(
      `https://musicatlas.ai/api/describe_track?artist=${encodedArtist}&track=${encodedTitle}`,
      {
        headers: {
          "Authorization": `Bearer ${key}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Describe track success:", data);
      return res.status(200).json(data);
    }

    // 2. If 404 — add track first
    if (response.status === 404) {
      console.log("Track not found — adding it...");

      const addResponse = await fetch("https://musicatlas.ai/api/add_track", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ artist, title })
      });

      if (!addResponse.ok) {
        const errorText = await addResponse.text();
        console.error("Add track failed:", errorText);
        return res.status(addResponse.status).json({ error: "Failed to add track" });
      }

      // 3. Retry describe after adding
      response = await fetch(
        `https://musicatlas.ai/api/describe_track?artist=${encodedArtist}&track=${encodedTitle}`,
        {
          headers: {
            "Authorization": `Bearer ${key}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Describe after add success:", data);
        return res.status(200).json(data);
      }
    }

    // Final failure
    const errorText = await response.text();
    console.error("Final describe failed:", response.status, errorText);
    return res.status(response.status).json({ error: "MusicAtlas API error" });
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: true, // ← This enables JSON body parsing!
    externalResolver: true,
  },
};