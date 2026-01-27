// api/musicatlas-describe.js
export default async function handler(req, res) {
  const { artist, title } = req.query;

  if (!artist || !title) {
    return res.status(400).json({ error: "Missing artist or title" });
  }

  const key = process.env.VITE_MUSICATLAS_KEY;

  try {
    console.log("Fetching:", artist, "-", title);
    
    // POST request with JSON body
    let response = await fetch("https://musicatlas.ai/api/describe_track", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        artist: artist,
        track: title
      })
    });

    console.log("Status:", response.status);

    // If not found, add it
    if (response.status === 404) {
      console.log("Adding track...");
      
      await fetch("https://musicatlas.ai/api/add_track", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ artist, title })
      });

      await new Promise(r => setTimeout(r, 1000));
      
      // Retry
      response = await fetch("https://musicatlas.ai/api/describe_track", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          artist: artist,
          track: title
        })
      });
      
      console.log("Retry status:", response.status);
    }

    const data = await response.json();
    console.log("Data received:", data);
    return res.json(data);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed" });
  }
}