// api/generate-feedback.js - Using Grok AI
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { track, musicAtlasData } = req.body;

  if (!track || !musicAtlasData) {
    console.error("Missing data:", { track: !!track, musicAtlasData: !!musicAtlasData });
    return res.status(400).json({ error: "Missing track or MusicAtlas data" });
  }

  const apiKey = process.env.VITE_XAI_KEY;
  
  if (!apiKey) {
    console.error("XAI API key not found in environment");
    return res.status(500).json({ error: "API key not configured" });
  }

  const music = musicAtlasData.music_characteristics || {};
  const audio = musicAtlasData.audio_characteristics || {};

  const bpm = Math.round(music.bpm || 120);
  const key = music.key || "Unknown";
  const mode = music.mode || "Major";
  const intensity = audio.perceived_intensity || "medium";
  const durationMs = track.duration_ms || 180000;
  const durationMin = Math.floor(durationMs / 60000);
  const durationSec = Math.floor((durationMs % 60000) / 1000);

  console.log("Track info:", { title: track.title, artist: track.artist });
  console.log("Music data:", { bpm, key, mode, intensity });

  const prompt = `You are an expert music supervisor analyzing songs for sync licensing in TV, film, advertising, and trailers.

Song: "${track.title}" by ${track.artist}

REAL DATA FROM MUSICATLAS:
- BPM: ${bpm}
- Key: ${key} ${mode}
- Perceived Intensity: ${intensity} (how energetic/danceable the track feels)
- Length: ${durationMin}:${durationSec.toString().padStart(2, '0')}

CONTEXT FOR SYNC LICENSING:
- Ideal BPM: 90-140 (versatile for most placements)
- Major keys: More versatile, work across genres
- Perceived Intensity: 
  * Low = dialogue/underscore scenes
  * Medium = most versatile, fits various moods
  * High = action, sports, upbeat scenes
- Ideal Length: 2:00-3:30 (perfect for editing)

YOUR TASK:
Provide specific, actionable feedback for these 4 categories. Be honest but encouraging. Focus on sync placement potential.

For each category, provide:
- "short": One concise insight (max 10 words)
- "why": Explain the score - what works and what could be better (2 sentences, be specific to THIS song)
- "improve": Actionable advice for better sync placement (2 sentences, be practical and specific)

Categories:
1. BPM Range - How the tempo affects placement versatility
2. Key & Mode - How the key/mode affects emotional range and versatility
3. Danceability - Based on perceived intensity (${intensity}), how this energy level affects placement types
4. Length - How the duration affects editing and placement opportunities

CRITICAL: Return ONLY valid JSON. No markdown code blocks. No explanations outside JSON. Just the raw JSON object.

Format:
{
  "bpmRange": { "short": "...", "why": "...", "improve": "..." },
  "keyMode": { "short": "...", "why": "...", "improve": "..." },
  "danceability": { "short": "...", "why": "...", "improve": "..." },
  "length": { "short": "...", "why": "...", "improve": "..." }
}`;

  try {
    console.log("Calling Grok AI...");
    
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log("Grok response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API error:", response.status, errorText);
      return res.status(500).json({ 
        error: "AI API failed", 
        details: errorText,
        status: response.status 
      });
    }

    const data = await response.json();
    console.log("Grok response received");

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in response");
      return res.status(500).json({ error: "No content from AI" });
    }

    let content = data.choices[0].message.content.trim();
    console.log("Raw AI content:", content);
    
    // Clean up any markdown formatting
    content = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Extract JSON if there's extra text
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}") + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      content = content.substring(jsonStart, jsonEnd);
    }

    console.log("Cleaned content:", content);

    const feedback = JSON.parse(content);
    console.log("Feedback parsed successfully");
    
    return res.json(feedback);

  } catch (error) {
    console.error("Error generating feedback:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      error: "Failed to generate feedback",
      message: error.message 
    });
  }
}