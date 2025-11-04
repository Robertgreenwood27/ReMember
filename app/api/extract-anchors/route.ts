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
          content: `You are a helpful assistant that extracts meaningful anchor words from journal entries. Pick heavily weighted words like persons places or conrete nouns that can be visual anchors in someone's mind.
Return ONLY a JSON array of lowercase words, like: ["word1", "word2", "word3"].`,
        },
        {
          role: "user",
          content: `Extract anchor words from this text:\n\n${text}`,
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
      return NextResponse.json({ anchors: [] });
    }

    let anchors: string[] = [];
    try {
      anchors = JSON.parse(response);
    } catch (err) {
      console.warn("⚠️ Failed to parse JSON, raw output:", response);
      return NextResponse.json({ anchors: [] });
    }

    const cleaned = Array.from(
      new Set(
        anchors
          .map((word: string) => word.toLowerCase().trim())
          .filter((word: string) => word.length >= 3)
      )
    );

    return NextResponse.json({ anchors: cleaned });
  } catch (error: any) {
    console.error("🧠 Error extracting anchors:", error.message || error);
    return NextResponse.json(
      { error: "Failed to extract anchors", details: error.message || error },
      { status: 500 }
    );
  }
}
