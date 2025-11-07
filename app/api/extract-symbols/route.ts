import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // You can keep using gpt-4o-mini, which returns reliable output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an intuitive dream interpreter and linguistic analyst.
Your task is to extract the most symbolically significant nouns and phrases from a dream entry — things that could represent imagery or recurring motifs in the dreamers subconscious.
Focus on people, animals, objects, places, natural elements, emotions embodied as imagery, and archetypal symbols (e.g. “mirror,” “door,” “ocean,” “father,” “snake,” “city,” “shadow,” “light”).

Guidelines:

Select concrete, visual, or emotionally charged nouns that could appear as symbols in someone’s mind.

Prefer distinctive or unusual words over common or abstract ones.

Avoid filler words, pronouns, verbs, and vague abstractions.

Output only the list of symbols (comma-separated or JSON array), no explanations.
Return ONLY a JSON array of lowercase words, like: ["word1", "word2", "word3"].`,
        },
        {
          role: "user",
          content: `Extract symbol words from this text:\n\n${text}`,
        },
      ],
      max_completion_tokens: 200,
    });

    // ✅ TypeScript-safe extraction of message text
    const choice = completion.choices?.[0];
    const message = choice?.message as Record<string, any> | undefined;
    const response =
      (message?.content?.trim?.() as string | undefined) ||
      (message?.output_text?.trim?.() as string | undefined) ||
      "";

    console.log("🔍 Raw OpenAI output:", response);

    if (!response) {
      console.warn("⚠️ No text returned from OpenAI");
      return NextResponse.json({ symbols: [] });
    }

    let symbols: string[] = [];
    try {
      symbols = JSON.parse(response);
    } catch (err) {
      console.warn("⚠️ Failed to parse JSON, raw output:", response);
      return NextResponse.json({ symbols: [] });
    }

    const cleaned = Array.from(
      new Set(
        symbols
          .map((word: string) => word.toLowerCase().trim())
          .filter((word: string) => word.length >= 3)
      )
    );

    return NextResponse.json({ symbols: cleaned });
  } catch (error: any) {
    console.error("🧠 Error extracting symbols:", error.message || error);
    return NextResponse.json(
      { error: "Failed to extract symbols", details: error.message || error },
      { status: 500 }
    );
  }
}
