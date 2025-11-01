import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ Gemini API key missing!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // or "gemini-1.5-flash" if 2.5 isn't supported yet
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 1024,
  },
});

const PROMPT_TEMPLATE = `You are a recipe generator. Return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe title",
  "ingredients": ["item 1", "item 2", "item 3"],
  "instructions": ["step 1", "step 2", "step 3"]
}
Create a recipe using these ingredients: `;

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing API key" },
      { status: 500 }
    );
  }

  try {
    const { ingredients } = await req.json();
    const prompt = PROMPT_TEMPLATE + ingredients;

    const result = await model.generateContent(prompt);
    const response = await result.response; // ✅ Await this
    const raw = response.text();

    const cleaned = raw
      .replace(/```json\s*|\s*```/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const recipe = JSON.parse(cleaned);

    if (
      recipe &&
      typeof recipe.title === "string" &&
      Array.isArray(recipe.ingredients) &&
      Array.isArray(recipe.instructions)
    ) {
      return NextResponse.json(recipe);
    }

    throw new Error("Invalid recipe structure");
  } catch (err: any) {
    console.error("❌ Generation Error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate recipe",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
