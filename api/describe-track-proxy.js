export default async function handler(req, res) {
  console.log("=== PROXY START ===");
  console.log("Proxy route hit – method:", req.method);
  console.log("Proxy received query:", req.query);
  console.log("Artist value:", req.query.artist);
  console.log("Title value:", req.query.title);   

  const { artist, title } = req.query;

  if (!artist || !title) {
    console.log("ERROR: Missing params in proxy");
    return res.status(400).json({ error: "Missing artist or title in proxy" });
  }

  const encodedArtist = encodeURIComponent(artist);
  const encodedTitle = encodeURIComponent(title);

  const key = process.env.VITE_MUSICATLAS_KEY;

  if (!key) {
    console.error("MusicAtlas key not found in env");
    return res.status(500).json({ error: "Server configuration error" });
  }

  console.log("API Key present:", !!key);
  console.log("API Key length:", key.length);
  console.log("API Key first 10 chars:", key.substring(0, 10));

  try {
    // Try with just 'track' parameter first
    const describeUrl = `https://musicatlas.ai/api/describe_track?artist=${encodedArtist}&track=${encodedTitle}`;
    console.log("Full URL:", describeUrl);
    console.log("Authorization header:", `Bearer ${key.substring(0, 10)}...`);

    let response = await fetch(describeUrl, {
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });

    console.log("Response status:", response.status);
    console.log("Response statusText:", response.statusText);
    
    // CRITICAL: Log the raw response
    const responseText = await response.text();
    console.log("Raw response body:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Parsed response:", data);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return res.status(500).json({ error: "Invalid JSON from MusicAtlas", raw: responseText });
    }

    if (response.ok) {
      console.log("✓ Describe track SUCCESS");
      return res.status(200).json(data);
    }

    // If we got here, response is not OK
    console.log("✗ Describe track FAILED");
    console.log("Response data:", data);

    if (response.status === 404) {
      console.log("Track not found (404) — attempting to add it...");

      const addUrl = "https://musicatlas.ai/api/add_track";
      console.log("Calling add_track:", addUrl);
      console.log("Add payload:", { artist, title });

      const addResponse = await fetch(addUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ artist, title })
      });

      const addResponseText = await addResponse.text();
      console.log("Add track response status:", addResponse.status);
      console.log("Add track response body:", addResponseText);

      if (!addResponse.ok) {
        console.error("✗ Add track FAILED");
        return res.status(addResponse.status).json({ 
          error: "Failed to add track",
          details: addResponseText 
        });
      }

      console.log("✓ Add track SUCCESS — retrying describe...");

      // Retry describe
      response = await fetch(describeUrl, {
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });

      const retryText = await response.text();
      console.log("Retry describe response:", retryText);

      if (response.ok) {
        const retryData = JSON.parse(retryText);
        console.log("✓ Retry describe SUCCESS");
        return res.status(200).json(retryData);
      }

      console.error("✗ Retry describe FAILED");
      return res.status(response.status).json({ 
        error: "Retry describe failed",
        details: retryText 
      });
    }

    // Non-404 error
    console.error("✗ Final describe failed with non-404 status");
    return res.status(response.status).json({ 
      error: "MusicAtlas API error",
      status: response.status,
      details: data 
    });
    
  } catch (error) {
    console.error("✗ PROXY ERROR:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};