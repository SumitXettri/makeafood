import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key not found!");
    return NextResponse.json(
      { error: "Server misconfigured: missing API key" },
      { status: 500 }
    );
  }

  const { ingredients } = await req.json();

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Changed from gemini-1.5-flash to gemini-pro

  try {
    // Prompt Gemini to always return valid JSON
    const prompt = `
    You are a recipe generator. Always return a valid JSON object ONLY (no extra text).
    The JSON format must be:

    {
      "title": "Recipe title",
      "ingredients": ["item 1", "item 2", "item 3"],
      "instructions": ["step 1", "step 2", "step 3"]
    }

    Now, create a recipe using these ingredients: ${ingredients}.
    `;

    const result = await model.generateContent(prompt);

    let output = result.response.text();
    console.log("Gemini raw output:", output);

    // 🔥 Clean up Gemini’s output (remove code fences if present)
    output = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let recipe;
    try {
      recipe = JSON.parse(output);
    } catch (err) {
      console.error("JSON parse error:", err, output);
      return NextResponse.json(
        { error: "Invalid JSON format from Gemini", raw: output },
        { status: 500 }
      );
    }

    return NextResponse.json(recipe);
  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "Failed to generate recipe", details: String(err) },
      { status: 500 }
    );
  }
}
