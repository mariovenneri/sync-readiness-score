// api/musicatlas-progress.js
export default async function handler(req, res) {
  const { job_id } = req.query;

  if (!job_id) {
    return res.status(400).json({ error: "Missing job_id" });
  }

  const key = process.env.VITE_MUSICATLAS_KEY;

  try {
    console.log("Checking progress for job:", job_id);

    const response = await fetch(
      `https://musicatlas.ai/api/add_track_progress?job_id=${job_id}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Progress status:", response.status);

    const data = await response.json();
    console.log("Progress data:", data);

    return res.json(data);

  } catch (error) {
    console.error("Progress error:", error);
    return res.status(500).json({ error: "Failed to get progress" });
  }
}