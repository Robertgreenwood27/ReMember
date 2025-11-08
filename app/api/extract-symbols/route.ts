import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// 🔒 Simple in-memory cache (resets on server restart)
const cache = new Map<string, { symbols: string[]; tags: string[] }>();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json({ symbols: [], tags: [] });
    }

    // ⚡ Check cache first
    if (cache.has(trimmed)) {
      console.log("🪄 Cache hit for dream text");
      return NextResponse.json(cache.get(trimmed));
    }

    // 🧠 Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an intuitive dream interpreter and linguistic analyst.

Your task is to extract two things from a dream journal entry:
1. The most symbolically significant nouns or imagery ("symbols").
2. The psychological and emotional themes that best describe the dream ("tags").

### Symbol Extraction
Identify concrete, visual, or emotionally charged nouns that could appear as symbols in the dreamer’s mind.
Focus on people, animals, objects, places, elements, and archetypal imagery (e.g. “mirror,” “door,” “ocean,” “father,” “snake,” “city,” “shadow,” “light”).
Avoid verbs, filler words, or abstractions.

### Tag Selection
Choose one or more tags that apply **only** from this fixed list:

**Mood**
calm, anxious, ecstatic, angry, fearful, peaceful, confused, joyful, lonely

**Clarity**
lucid, vivid, fragmented, blurry, surreal

**Theme**
falling, flying, pursuit, transformation, death, birth, loss, discovery, betrayal, escape, reunion

**Archetype**
shadow, anima, animus, self, ego, wise_old, trickster

**Source**
recurring, childhood, recent_event, stress, relationship

Only include tags that clearly match the emotional tone, structure, or archetypal theme of the dream.
Do not create new tags.

### Output Format
Respond ONLY with a valid JSON object like this:
{
  "symbols": ["mirror", "ocean", "snake"],
  "tags": ["fearful", "shadow", "transformation"]
}`,
        },
        {
          role: "user",
          content: `Extract symbol words and tags from this text:\n\n${trimmed}`,
        },
      ],
      max_completion_tokens: 200,
    });

    // ✅ Parse output
    const raw = completion.choices?.[0]?.message?.content?.trim?.() ?? "";
    console.log("🔍 Raw OpenAI output:", raw);

    let data: { symbols?: string[]; tags?: string[] } = { symbols: [], tags: [] };

    // Primary parse attempt
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn("⚠️ Could not parse JSON. Attempting recovery...");

      // 🧩 JSON repair fallback
      try {
        const jsonMatch = raw.match(/{[\s\S]*}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
          console.log("✅ Recovered partial JSON structure.");
        }
      } catch (err2) {
        console.warn("⚠️ Failed JSON recovery:", err2);
      }
    }

    // 🧹 Safety cleanups
    const cleanSymbols = Array.from(
      new Set(
        (data.symbols || [])
          .map((w) => w.toLowerCase().trim())
          .filter((w) => w.length >= 3)
      )
    );

    const validTags = [
      // Mood
      "calm", "anxious", "ecstatic", "angry", "fearful",
      "peaceful", "confused", "joyful", "lonely",
      // Clarity
      "lucid", "vivid", "fragmented", "blurry", "surreal",
      // Theme
      "falling", "flying", "pursuit", "transformation", "death",
      "birth", "loss", "discovery", "betrayal", "escape", "reunion",
      // Archetype
      "shadow", "anima", "animus", "self", "ego", "wise_old", "trickster",
      // Source
      "recurring", "childhood", "recent_event", "stress", "relationship",
    ];

    const cleanTags = Array.from(
      new Set(
        (data.tags || [])
          .map((t) => t.toLowerCase().trim())
          .filter((t) => validTags.includes(t))
      )
    );

    const result = { symbols: cleanSymbols, tags: cleanTags };

    // 💾 Cache result for duplicate dream texts
    cache.set(trimmed, result);
    console.log(`🧠 Cached result (cache size: ${cache.size})`);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("🧠 Error extracting data:", err.message || err);
    return NextResponse.json(
      { error: "Failed to extract symbols/tags", details: err.message || err },
      { status: 500 }
    );
  }
}
