// api/addtrack.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, title } = req.body;

  if (!artist || !title) {
    return res.status(400).json({ error: "Missing artist or title" });
  }

  const key = process.env.MUSICATLAS_API_KEY;

  try {
    console.log("Adding track:", artist, "-", title);
    
    const response = await fetch("https://musicatlas.ai/api/add_track", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        artist: artist,
        title: title
      })
    });

    const data = await response.json();
    console.log("Add track response:", data);
    
    return res.json(data);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed to add track" });
  }
}