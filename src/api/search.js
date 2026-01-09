// api/search.js
export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query" });
  }

  const url = `https://musicatlas.ai/map/api/autocomplete_proxy?q=${encodeURIComponent(q)}&_=${Date.now()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: "MusicAtlas error" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy error" });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};