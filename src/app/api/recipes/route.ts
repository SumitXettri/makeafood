// app/api/recipes/route.ts
import { NextResponse } from "next/server";

// Simple in-memory cache (per server instance, resets on restart)
const cache: { [key: string]: { data: any; expires: number } } = {};

// Add keyword index variable
let keywordIndex = 0;

const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";

const mealKeywords = [
  "chicken",
  "pasta",
  "beef",
  "rice",
  "salad",
  "fish",
  "soup",
  "vegetable",
  "dessert",
  "egg",
];

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
    const spoonUrl = query
      ? `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
          query
        )}&number=8&addRecipeInformation=true&instructionsRequired=true&fillIngredients=true&apiKey=${apiKey}`
      : `https://api.spoonacular.com/recipes/random?number=4&apiKey=${apiKey}`; // Keep at 4 for Spoonacular

    let mealUrl: string;
    let mealData: any;

    if (query) {
      mealUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
        query
      )}`;
      const mealRes = await fetch(mealUrl);
      mealData = await mealRes.json();
    } else {
      // Increase to 8 random recipes from MealDB
      const randomRecipePromises = Array(8)
        .fill(null)
        .map(async () => {
          const response = await fetch(MEALDB_RANDOM);
          const data = await response.json();
          return data.meals?.[0];
        });

      const randomMeals = await Promise.all(randomRecipePromises);
      mealData = { meals: randomMeals.filter(Boolean) };
    }

    // Fetch Spoonacular separately
    const spoonRes = await fetch(spoonUrl);
    let results: any[] = [];

    // Set different limits for each source
    const spoonacularLimit = 4; // 4 recipes from Spoonacular
    const mealdbLimit = 8; // 8 recipes from MealDB

    // Process Spoonacular results
    if (spoonRes.ok) {
      const spoonData = await spoonRes.json();
      const spoonRecipes = (spoonData.results || spoonData.recipes || [])
        .slice(0, spoonacularLimit)
        .map((r: any) => ({
          id: `s-${r.id}`,
          title: r.title,
          image: r.image,
          source: "Spoonacular",
          description:
            r.summary?.replace(/<[^>]+>/g, "").slice(0, 150) + "…" ||
            r.instructions?.slice(0, 150) + "…" ||
            "Description coming soon.",
          // Add ingredients from extendedIngredients
          ingredients:
            r.extendedIngredients?.map((ing: any) =>
              `${ing.amount} ${ing.unit} ${ing.name}`.trim()
            ) || [],
          prep_time_minutes: r.preparationMinutes || 0,
          cook_time_minutes: r.cookingMinutes || 0,
          servings: r.servings || 0,
          difficulty_level: r.difficulty || "Medium",
        }));
      results.push(...spoonRecipes);
    }

    // Process MealDB results
    if (mealData.meals?.length) {
      const mealRecipes = mealData.meals.slice(0, mealdbLimit).map((m: any) => {
        // Extract ingredients from MealDB's numbered properties
        const ingredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = m[`strIngredient${i}`];
          const measure = m[`strMeasure${i}`];
          if (ingredient && ingredient.trim()) {
            ingredients.push(
              `${measure?.trim() || ""} ${ingredient.trim()}`.trim()
            );
          }
        }

        return {
          id: `m-${m.idMeal}`,
          title: m.strMeal,
          image: m.strMealThumb,
          source: "MealDB",
          description:
            m.strInstructions?.slice(0, 150) + "…" ||
            "Description coming soon.",
          ingredients,
          // Add additional recipe details
          prep_time_minutes: 0, // MealDB doesn't provide this
          cook_time_minutes: 0, // MealDB doesn't provide this
          servings: 0, // MealDB doesn't provide this
          difficulty_level: "Medium", // MealDB doesn't provide this
        };
      });
      results.push(...mealRecipes);
    }

    // Shuffle results when no query to mix sources
    if (!query) {
      results = [...results].sort(() => Math.random() - 0.5);
    }

    // Return all 12 recipes (4 Spoonacular + 8 MealDB)
    results = [...results].slice(0, 12);

    // Cache for 3 minutes
    cache[cacheKey] = { data: results, expires: now + 3 * 60 * 1000 };

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
