const API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_KEY = import.meta.env.VITE_XAI_KEY || "";

const keyNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export async function generateSyncFeedback(track, features) {
  const prompt = `
You are a world-class music sync licensing expert analyzing songs for TV, film, ads, and trailers.

Song: "${track.title}" by ${track.artist}
BPM: ${features.bpm}
Key: ${keyNames[features.key]} ${features.mode === 1 ? "Major" : "Minor"}
Energy: ${(features.energy * 100).toFixed(0)}%
Valence (mood): ${(features.valence * 100).toFixed(0)}%
Danceability: ${(features.danceability * 100).toFixed(0)}%
Length: ${(features.duration_ms / 1000).toFixed(0)} seconds

For each category, provide:
- "short": One short summary sentence (max 12 words)
- "why": Why the score is not perfect (honest but encouraging, exactly 2 sentences)
- "improve": How to improve for sync (specific, actionable tips, exactly 2 sentences)

Categories:
1. Mood & Energy
2. Key & Mode
3. BPM Range
4. Length
5. Danceability

Return ONLY valid JSON. No explanations. No markdown. No extra text.

{
  "moodEnergy": { "short": "...", "why": "...", "improve": "..." },
  "keyMode": { "short": "...", "why": "...", "improve": "..." },
  "bpmRange": { "short": "...", "why": "...", "improve": "..." },
  "length": { "short": "...", "why": "...", "improve": "..." },
  "danceability": { "short": "...", "why": "...", "improve": "..." }
}
`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + XAI_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    console.error("Grok API error:", response.status);
    return null;
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    console.error("No choices from Grok");
    return null;
  }

  let content = data.choices[0].message.content.trim();

  // Clean up formatting
  let cleaned = content
    .replace(/```json\n?/, "")
    .replace(/```/g, "")
    .trim();

  // Extract JSON block
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}") + 1;
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Final parse failed. Raw cleaned content:", cleaned);
    return null;
  }
}