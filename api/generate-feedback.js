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

  const prompt = `You are a music supervisor with 15+ years placing songs in TV, film, ads, and trailers. Your role is to EDUCATE artists about sync licensing, NOT to tell them to change their music.

Song: "${track.title}" by ${track.artist}

TRACK DATA:
- BPM: ${bpm}
- Key: ${key} ${mode}
- Perceived Intensity: ${intensity}
- Length: ${durationMin}:${durationSec.toString().padStart(2, '0')}

YOUR MISSION: Help artists understand how THEIR music (as it exists) fits into the sync world. Show them what types of scenes their track works for and how to position it. DO NOT suggest rewriting or changing the fundamental character of the song.

HOW SUPERVISORS THINK:
They ask: "Does this build tension without overpowering dialogue?" "Does it hit hard in the chorus?" "Will it feel urgent but not chaotic?"

SCENE MATCHING BY INTENSITY:
- LOW (dialogue-safe): Underscore, voice-overs, reality TV, intimate scenes
- MEDIUM (versatile): Emotional montages, narrative arcs, most placements
- HIGH (momentum): Sports highlights, action sequences, upbeat commercials
- VERY HIGH (maximum impact): Trailer climaxes, epic moments

For each category:
- "short": One educational insight about THIS track's sync potential (8 words max)
- "why": Explain what scenes/placements THIS track (as is) works well for, and what its current attributes mean for placement opportunities (2 sentences, educational tone)
- "improve": Focus on HOW TO MARKET/POSITION the track, alternative versions to CREATE (not change the original), or additional edits that preserve the original (2 sentences, educational not prescriptive)

CATEGORIES:

1. BPM RANGE (${bpm} BPM)
EDUCATIONAL FOCUS: Explain what this tempo is naturally suited for.
- 60-90: Emotional weight, drama, contemplative scenes
- 90-110: Versatile, works for emotional and upbeat contexts
- 110-130: Upbeat, commercials, feel-good moments
- 130-150: High energy, sports, action
- 150+: Intense action, aggressive scenes only

DO NOT say "change your BPM" - instead explain what THIS BPM is good for and suggest creating ADDITIONAL versions (e.g., "Consider creating a half-time version for drama" not "make it slower").

2. KEY & MODE (${key} ${mode})
CRITICAL: We are NOT interested in advice about rewriting the song or changing the mode.
EDUCATIONAL FOCUS: Explain the unique qualities and placement opportunities for THIS key and mode.

${mode.toLowerCase() === 'minor' ? `
This track is in a MINOR key - explain why minor keys are VALUABLE for sync:
- Perfect for dramatic scenes, tension, introspection
- Ideal for crime dramas, thrillers, emotional moments
- Works great for moody commercials, luxury brands
- Don't suggest changing to major - celebrate what minor brings
` : `
This track is in a MAJOR key - explain the versatility:
- Uplifting, optimistic, works across many contexts
- Great for feel-good moments, commercials, promos
- Versatile across genres and scene types
`}

3. VIBE (Perceived Intensity: ${intensity})
EDUCATIONAL FOCUS: Explain what this energy level means for placement.
- Low: Safe for underscore, won't compete with dialogue, perfect for beds
- Medium: Supports narrative without dominating, most versatile
- High: Drives action and energy, great for high-impact moments
- Very High: Maximum impact, trailers and climactic scenes

Explain what types of scenes/briefs THIS vibe naturally fits.

4. LENGTH (${durationMin}:${durationSec.toString().padStart(2, '0')})
EDUCATIONAL FOCUS: Explain editorial implications and opportunities.
- Under 2:00: Great for quick cuts, promos, may need extending for some uses
- 2:00-3:00: Sweet spot for most placements
- 3:00-4:00: Works for montages and emotional builds, may need editing for commercials
- 4:00+: Album cut length, explain when this works (film, long montages) vs when edits help (commercials)

Suggest creating ADDITIONAL versions (radio edit, extended, instrumental) not changing the original.

TONE: Educational and empowering. Help artists understand the sync landscape and where THEIR music fits. Make them excited about their track's potential, not discouraged about what it isn't.

Return ONLY valid JSON:
{
  "bpmRange": { "short": "...", "why": "...", "improve": "..." },
  "keyMode": { "short": "...", "why": "...", "improve": "..." },
  "vibe": { "short": "...", "why": "...", "improve": "..." },
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