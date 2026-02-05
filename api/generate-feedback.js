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

HOW SUPERVISORS THINK:
They ask: "Does this build tension without overpowering dialogue?" "Does it hit hard in the chorus?" "Will it feel urgent but not chaotic?"

SCENE MATCHING BY INTENSITY:
- LOW (dialogue-safe): Underscore, voice-overs, reality TV, intimate scenes
- MEDIUM (versatile): Emotional montages, narrative arcs, most placements
- HIGH (momentum): Sports highlights, action sequences, upbeat commercials
- VERY HIGH (maximum impact): Trailer climaxes, epic moments

WHAT MAKES TRACKS PLACEABLE:
✓ Dynamic builds (sparse verse → explosive chorus)
✓ Doesn't compete with dialogue
✓ Clear emotional arc
✓ Edit-friendly structure
✗ Feels "busy" or cluttered
✗ Aggressive even at low volume
✗ Lacks dynamic contrast

YOUR MISSION:
Give this artist HONEST, ACTIONABLE feedback that prepares their track for SyncRep submission. Speak like a supervisor giving notes to an artist they want to help succeed.

For each category:
- "short": One punchy insight (8 words max) - use supervisor language
- "why": Explain in SCENE terms - what scenes would this work for? What's limiting it? (2 sentences)
- "improve": Specific production advice that increases placement odds (2 sentences)

CATEGORIES:

1. BPM RANGE (${bpm} BPM)
Think: Does this tempo match natural scene energy? Is it versatile across scene types?
- 90-100: Drama, tension, emotional weight
- 100-120: Versatile, works for most scenes
- 120-140: Upbeat commercials, sports, energy
- 140+: High-energy only, limits options

2. KEY & MODE (${key} ${mode})
Think: Emotional palette and genre crossover potential
- Major: Optimistic, uplifting, works across genres
- Minor: Dramatic, introspective, specific moods
Does this key limit or expand placement opportunities?

3. DANCEABILITY (Perceived Intensity: ${intensity})
Think: Energy vs. dialogue safety
- Low: Safe for underscore, won't mask speech
- Medium: Supports narrative without dominating
- High: Drives action, but may overpower dialogue
How does this track's energy affect scene compatibility?

4. LENGTH (${durationMin}:${durationSec.toString().padStart(2, '0')})
Think: Editorial flexibility
- 2:00-3:30: Perfect for most placements
- Under 2:00: May be too short for emotional builds
- Over 3:30: Needs editing, limits quick turnaround
Can editors work with this easily?

TONE: Be encouraging but honest. Artists need to know what's working AND what's holding them back from placement. Think: "This could land in X type of scene, but supervisors might pass because..."

Return ONLY valid JSON:
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