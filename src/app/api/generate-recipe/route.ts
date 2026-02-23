import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← must be service role, NOT anon key
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredients, userId } = body;

    console.log("📥 Request received");
    console.log("👤 userId:", userId);
    console.log("🥕 ingredients:", ingredients);

    const validIngredients = ingredients.filter(
      (ing: string) => ing.trim() !== "",
    );

    if (validIngredients.length === 0) {
      console.log("❌ No valid ingredients");
      return NextResponse.json(
        { error: "No ingredients provided" },
        { status: 400 },
      );
    }

    console.log("🤖 Calling Groq...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional chef. When given a list of ingredients, generate a detailed recipe.
Format your response as JSON with this exact structure:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "instructions": ["Step 1...", "Step 2...", "Step 3..."],
  "prep_time": "X mins",
  "servings": "X servings",
  "difficulty": "Easy",
  "youtube_link": ""
}
Return ONLY valid JSON, no markdown, no extra text, no backticks.`,
        },
        {
          role: "user",
          content: `Generate a recipe using these ingredients: ${validIngredients.join(", ")}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content || "{}";
    console.log("✅ Groq raw response:", content);

    const cleaned = content.replace(/```json|```/g, "").trim();
    const recipe = JSON.parse(cleaned);
    console.log("🍽️ Parsed recipe:", recipe.title);

    // Save to Supabase
    if (userId) {
      console.log("💾 Saving to Supabase for userId:", userId);

      const { data, error: insertError } = await supabase
        .from("recipe_sessions")
        .insert({
          user_id: userId,
          ingredients: validIngredients,
          recipe: recipe,
        })
        .select()
        .single();

      if (insertError) {
        console.error(
          "❌ Supabase insert error:",
          insertError.message,
          insertError.details,
          insertError.hint,
        );
      } else {
        console.log("✅ Saved to Supabase! Session ID:", data?.id);
      }
    } else {
      console.log(
        "⚠️ No userId — skipping Supabase save (user not logged in?)",
      );
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("💥 Route error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 },
    );
  }
}
