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
  const genres = musicAtlasData.genres || [];

  const bpm = Math.round(music.bpm || 120);
  const key = music.key || "Unknown";
  const mode = music.mode || "Major";
  const intensity = audio.perceived_intensity || "medium";
  const durationMs = track.duration_ms || 180000;
  const durationMin = Math.floor(durationMs / 60000);
  const durationSec = Math.floor((durationMs % 60000) / 1000);

  // Match genre the same way ScoreBreakdown does
  const genreMap = {
    "hip-hop":    ["hip-hop", "hip hop", "rap", "trap", "drill"],
    "rock":       ["rock", "alternative rock", "indie rock", "punk"],
    "indie":      ["indie", "indie pop", "indie folk", "lo-fi", "bedroom pop"],
    "pop":        ["pop", "synth-pop", "electropop", "dance pop"],
    "rnb":        ["r&b", "rnb", "soul", "neo-soul"],
    "electronic": ["electronic", "edm", "house", "techno", "ambient"],
    "country":    ["country", "americana", "folk"],
    "cinematic":  ["cinematic", "soundtrack", "orchestral", "score"],
  };

  let matchedGenre = null;
  const normalizedTags = genres.map(g => g.toLowerCase().trim());
  for (const [genre, keywords] of Object.entries(genreMap)) {
    if (normalizedTags.some(tag => keywords.some(k => tag.includes(k)))) {
      matchedGenre = genre;
      break;
    }
  }

  const genreContext = matchedGenre
    ? `Genre: ${matchedGenre} (identified from tags: ${genres.slice(0, 3).join(", ")})`
    : `Genre: Could not be identified from tags (${genres.slice(0, 3).join(", ")})`;

  console.log("Track info:", { title: track.title, artist: track.artist });
  console.log("Music data:", { bpm, key, mode, intensity });
  console.log("Genre context:", genreContext);

  const prompt = `You are a music supervisor with 15+ years placing songs in TV, film, ads, and trailers. Your role is to EDUCATE artists about sync licensing, NOT to tell them to change their music.

Song: "${track.title}" by ${track.artist}

TRACK DATA:
- BPM: ${bpm}
- Key: ${key} ${mode}
- Perceived Intensity: ${intensity}
- Length: ${durationMin}:${durationSec.toString().padStart(2, '0')}
- ${genreContext}

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
${matchedGenre ? `This is a ${matchedGenre} track. Frame tempo feedback in the context of how ${matchedGenre} tracks are used in sync.` : ""}
EDUCATIONAL FOCUS: Explain what this tempo is naturally suited for.
DO NOT say "change your BPM" - instead explain what THIS BPM is good for and suggest creating ADDITIONAL versions if relevant.

2. KEY & MODE (${key} ${mode})
CRITICAL RULES:
- NEVER suggest changing the key or mode
- NEVER imply one mode is better than the other
- Both major and minor serve equally valuable and distinct purposes in sync
- Major: bright, open tonal quality — works well for uplifting, aspirational, and commercial placements
- Minor: emotional depth and tension — works well for dramatic, introspective, and cinematic placements
${matchedGenre ? `For ${matchedGenre} tracks specifically, frame the mode in terms of what placement opportunities it opens up within this genre.` : ""}
Frame the feedback around what unique placement opportunities THIS key and mode creates.

3. VIBE (Perceived Intensity: ${intensity})
${matchedGenre ? `For ${matchedGenre} tracks, frame intensity feedback around what supervisors in this genre are typically looking for.` : ""}
EDUCATIONAL FOCUS: Explain what this energy level means for placement — every intensity level has its place.

4. LENGTH (${durationMin}:${durationSec.toString().padStart(2, '0')})
EDUCATIONAL FOCUS: Explain editorial implications and opportunities.
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
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log("Grok response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API error:", response.status, errorText);
      return res.status(500).json({ error: "AI API failed", details: errorText, status: response.status });
    }

    const data = await response.json();
    console.log("Grok response received");

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in response");
      return res.status(500).json({ error: "No content from AI" });
    }

    let content = data.choices[0].message.content.trim();
    console.log("Raw AI content:", content);

    content = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

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
    return res.status(500).json({ error: "Failed to generate feedback", message: error.message });
  }
}