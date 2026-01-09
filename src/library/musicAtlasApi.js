// src/library/musicAtlasApi.js

const MUSICATLAS_KEY = import.meta.env.VITE_MUSICATLAS_KEY || "";

export async function getTrackAnalysis(artist, title) {
  const encodedArtist = encodeURIComponent(artist);
  const encodedTitle = encodeURIComponent(title);

  // First try describe_track
  let response = await fetch(
    `https://musicatlas.ai/api/describe_track?artist=${encodedArtist}&track=${encodedTitle}`,
    {
      headers: {
        "Authorization": "Bearer " + MUSICATLAS_KEY
      }
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log("Describe track success:", data);
    return data;
  }

  // If not found — add the track first
  if (response.status === 404) {
    console.log("Track not found — adding it...");
    const addResponse = await fetch("https://musicatlas.ai/api/add_track", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + MUSICATLAS_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ artist, title })
    });

    if (!addResponse.ok) {
      console.error("Add track failed");
      return null;
    }

    // Try describe again after adding
    response = await fetch(
      `https://musicatlas.ai/api/describe_track?artist=${encodedArtist}&track=${encodedTitle}`,
      {
        headers: {
          "Authorization": "Bearer " + MUSICATLAS_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Describe after add:", data);
      return data;
    }
  }

  console.error("Final describe failed:", response.status);
  return null;
}