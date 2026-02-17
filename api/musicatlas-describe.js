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

  const hasValidData = (data) => {
    return (
      data &&
      data.music_characteristics &&
      data.music_characteristics.bpm &&
      data.music_characteristics.bpm > 0
    );
  };

  try {
    console.log("Fetching:", artist, "-", title);

    let response = await describeTrack();
    console.log("Status:", response.status);

    // Track not in MusicAtlas — add it
    if (response.status === 404) {
      console.log("Track not found — adding to MusicAtlas...");

      const addResponse = await fetch("https://musicatlas.ai/api/add_track", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ artist, title })
      });

      const addData = await addResponse.json();
      const jobId = addData.job_id || null;
      console.log("Add track job_id:", jobId);

      // Wait 2 seconds then retry once
      await new Promise(r => setTimeout(r, 2000));
      response = await describeTrack();
      console.log("Retry status:", response.status);

      // Still not found after retry — tell the app it's processing
      if (response.status === 404) {
        console.log("Track still processing — returning 202");
        return res.status(202).json({
          status: "processing",
          job_id: jobId,
          message: "Track submitted for analysis"
        });
      }
    }

    const data = await response.json();
    console.log("Data received:", JSON.stringify(data).slice(0, 100));

    // Got a response but data is empty/invalid — also treating as processing
    if (!hasValidData(data)) {
      console.log("Track data incomplete — returning 202");
      return res.status(202).json({
        status: "processing",
        message: "Track submitted for analysis"
      });
    }

    return res.json(data);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Failed" });
  }
}