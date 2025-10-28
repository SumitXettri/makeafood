import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini once, outside request handler
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Updated model name
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 1024,
  },
});

// Prepare prompt template once
const PROMPT_TEMPLATE = `You are a recipe generator. Return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe title",
  "ingredients": ["item 1", "item 2", "item 3"],
  "instructions": ["step 1", "step 2", "step 3"]
}
Create a recipe using these ingredients: `;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: missing API key" },
      { status: 500 }
    );
  }

  try {
    const { ingredients } = await req.json();
    const prompt = PROMPT_TEMPLATE + ingredients;

    const result = await model.generateContent(prompt);
    const output = result.response
      .text()
      .replace(/```json\s*|\s*```/g, "") // Remove code fences in one go
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ") // Replace all whitespace with single space
      .trim();

    try {
      const recipe = JSON.parse(output);

      // Validate with type assertion for better performance
      if (
        typeof recipe === "object" &&
        recipe &&
        typeof recipe.title === "string" &&
        Array.isArray(recipe.ingredients) &&
        Array.isArray(recipe.instructions) &&
        recipe.ingredients.length &&
        recipe.instructions.length
      ) {
        return NextResponse.json(recipe);
      }

      throw new Error("Invalid recipe structure");
    } catch (err) {
      return NextResponse.json(
        {
          error: "Failed to parse recipe",
          details: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}
