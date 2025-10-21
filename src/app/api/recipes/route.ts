// app/api/recipes/route.ts
import { NextResponse } from "next/server";

// Simple in-memory cache (per server instance, resets on restart)
const cache: { [key: string]: { data: any; expires: number } } = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || ""; // empty = random
  const apiKey = process.env.SPOONACULAR_API_KEY;

  const cacheKey = query || "random";
  const now = Date.now();

  // Return cached response if still valid
  if (cache[cacheKey] && cache[cacheKey].expires > now) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    const results: any[] = [];

    const spoonUrl = query
      ? `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
          query
        )}&number=8&addRecipeInformation=true&instructionsRequired=true&fillIngredients=true&apiKey=${apiKey}`
      : `https://api.spoonacular.com/recipes/random?number=8&apiKey=${apiKey}`;

    const mealUrl = query
      ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
          query
        )}`
      : `https://www.themealdb.com/api/json/v1/1/random.php`;

    // Fetch both APIs in parallel
    const [spoonRes, mealRes] = await Promise.all([
      fetch(spoonUrl),
      fetch(mealUrl),
    ]);

    // Spoonacular
    if (spoonRes.ok) {
      const spoonData = await spoonRes.json();
      const spoonRecipes = (spoonData.results || spoonData.recipes || []).map(
        (r: any) => ({
          id: `s-${r.id}`,
          title: r.title,
          image: r.image,
          source: "Spoonacular",
          description:
            r.summary?.replace(/<[^>]+>/g, "").slice(0, 150) + "…" ||
            r.instructions?.slice(0, 150) + "…" ||
            "Description coming soon.",
        })
      );
      results.push(...spoonRecipes);
    }

    // MealDB
    if (mealRes.ok) {
      const mealData = await mealRes.json();
      const mealRecipes = (mealData.meals || []).map((m: any) => ({
        id: `m-${m.idMeal}`,
        title: m.strMeal,
        image: m.strMealThumb,
        source: "MealDB",
        description:
          m.strInstructions?.slice(0, 150) + "…" || "Description coming soon.",
      }));
      results.push(...mealRecipes);
    }

    // Cache for 3 minutes
    cache[cacheKey] = { data: results, expires: now + 3 * 60 * 1000 };

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
