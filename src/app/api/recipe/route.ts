import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  },
});

const PROMPT_TEMPLATE = `
You are a professional recipe generator. Create a delicious and practical recipe.

Return ONLY a valid JSON object with this EXACT structure (no extra text):

{
  "title": "Creative recipe name",
  "ingredients": ["detailed ingredient 1 with quantity", "ingredient 2", "etc"],
  "instructions": ["detailed step 1", "step 2", "step 3", "etc"],
  "prep_time": "X minutes",
  "servings": "X servings",
  "difficulty": "Easy/Medium/Hard"
}

Rules:
- Include 6-12 ingredients with specific quantities
- Provide 5-8 clear, detailed cooking steps
- Make it practical and achievable
- Be creative but realistic

Create a recipe using these ingredients:
`;

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing API key" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const ingredients = body?.ingredients;

    if (!ingredients || typeof ingredients !== "string") {
      return NextResponse.json(
        {
          error:
            "Invalid ingredients input. Please provide ingredients as a string.",
        },
        { status: 400 }
      );
    }

    console.log("🍳 Generating recipe for:", ingredients);

    const prompt = `${PROMPT_TEMPLATE}${ingredients}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Clean up the response
    const cleaned = rawText
      .replace(/```json|```/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();

    console.log("📄 Raw API Response:", cleaned);

    const recipe = JSON.parse(cleaned);

    // Validate the structure
    if (
      typeof recipe?.title === "string" &&
      Array.isArray(recipe?.ingredients) &&
      Array.isArray(recipe?.instructions) &&
      recipe.ingredients.length > 0 &&
      recipe.instructions.length > 0
    ) {
      console.log("✅ Recipe generated successfully:", recipe.title);
      return NextResponse.json(recipe);
    }

    throw new Error("Invalid recipe structure returned by model");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown generation error";

    console.error("❌ Gemini Generation Error:", err);

    // Return a more detailed error response
    return NextResponse.json(
      {
        error: "Failed to generate recipe",
        details: message,
        help: "Please check that your GEMINI_API_KEY is valid and has sufficient quota.",
      },
      { status: 500 }
    );
  }
}
