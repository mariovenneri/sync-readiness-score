// api/musicatlas-describe.js
export default async function handler(req, res) {
  const { artist, title } = req.query;

  if (!artist || !title) {
    return res.status(400).json({ error: "Missing artist or title" });
  }

  const key = process.env.VITE_MUSICATLAS_KEY;

  const describeTrack = async () => {
    return fetch("https://musicatlas.ai/api/describe_track", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ artist, track: title })
    });
  };

  const addTrack = async () => {
    const addResponse = await fetch("https://musicatlas.ai/api/add_track", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ artist, title })
    });
    const addData = await addResponse.json();
    console.log("Add track response:", addData);
    return addData.job_id || null;
  };

  const hasValidData = (data) => {
    return (
      data &&
      data.music_characteristics &&
      data.music_characteristics.bpm &&
      data.music_characteristics.bpm > 0
    );
  };

  const returnProcessing = (jobId) => {
    console.log("Returning 202 with job_id:", jobId);
    return res.status(202).json({
      status: "processing",
      job_id: jobId,
      message: "Track submitted for analysis"
    });
  };

  try {
    console.log("Fetching:", artist, "-", title);

    let response = await describeTrack();
    console.log("Status:", response.status);

    // Track not in MusicAtlas — add it then retry once
    if (response.status === 404) {
      console.log("Track not found — adding to MusicAtlas...");
      const jobId = await addTrack();
      await new Promise(r => setTimeout(r, 2000));
      response = await describeTrack();
      console.log("Retry status:", response.status);

      if (response.status === 404) {
        return returnProcessing(jobId);
      }
    }

    const data = await response.json();
    console.log("Data received:", JSON.stringify(data).slice(0, 100));

    // Data exists but incomplete — add track to trigger reprocessing
    if (!hasValidData(data)) {
      console.log("Track data incomplete — adding to MusicAtlas...");
      const jobId = await addTrack();
      return returnProcessing(jobId);
    }

    return res.json(data);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed" });
  }
}