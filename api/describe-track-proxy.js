// api/describe-track-proxy.js — Vercel serverless proxy (GET)

export default async function handler(req, res) {
  console.log("Proxy route hit – method:", req.method);
  console.log("Proxy received query:", req.query);
  console.log("Artist value:", req.query.artist);
  console.log("Title value:", req.query.title);   

  const { artist, title } = req.query;

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
    const describeUrl = `https://musicatlas.ai/api/describe_track?artist=${encodedArtist}&track=${encodedTitle}&title=${encodedTitle}`;
    console.log("Calling MusicAtlas describe_track with URL:", describeUrl);

    let response = await fetch(describeUrl, {
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Describe track success:", data);
      return res.status(200).json(data);
    }

    console.log("Describe track failed with status:", response.status);

    if (response.status === 404) {
      console.log("Track not found — adding it...");

      const addUrl = "https://musicatlas.ai/api/add_track";
      console.log("Calling MusicAtlas add_track with URL:", addUrl);

      const addResponse = await fetch(addUrl, {
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
        return res.status(addResponse.status).json({ error: errorText || "Failed to add track" });
      }

      console.log("Add track success — retrying describe...");

      // Retry describe
      response = await fetch(describeUrl, {
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Describe after add success:", data);
        return res.status(200).json(data);
      }

      const errorText = await response.text();
      console.error("Retry describe failed:", response.status, errorText);
      return res.status(response.status).json({ error: errorText || "Retry describe failed" });
    }

    const errorText = await response.text();
    console.error("Final describe failed:", response.status, errorText);
    return res.status(response.status).json({ error: errorText || "MusicAtlas API error" });
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};