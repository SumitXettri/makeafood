// app/api/recipes/route.ts
import { NextResponse } from "next/server";

// Interfaces for API data
interface SpoonacularIngredient {
  amount: number;
  unit: string;
  name: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  summary?: string;
  instructions?: string;
  extendedIngredients?: SpoonacularIngredient[];
  preparationMinutes?: number;
  cookingMinutes?: number;
  servings?: number;
  difficulty?: string;
}

interface MealDBRecipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strInstructions?: string;
  strYoutube?: string;
  [key: string]: string | undefined;
}

interface UnifiedRecipe {
  id: string;
  title: string;
  image: string;
  source: string;
  description: string;
  ingredients: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty_level: string;
  youtube_link: string;
}

// Simple in-memory cache (per server instance, resets on restart)
const cache: Record<string, { data: UnifiedRecipe[]; expires: number }> = {};

const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";

// Helper: generate YouTube search link
function getYouTubeSearchLink(recipeTitle: string): string {
  const searchQuery = encodeURIComponent(`${recipeTitle} recipe`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const apiKey = process.env.SPOONACULAR_API_KEY;

  const cacheKey = query || "random";
  const now = Date.now();

  // Return cached data if valid
  if (cache[cacheKey] && cache[cacheKey].expires > now) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    const spoonUrl = query
      ? `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
          query
        )}&number=8&addRecipeInformation=true&instructionsRequired=true&fillIngredients=true&apiKey=${apiKey}`
      : `https://api.spoonacular.com/recipes/random?number=4&apiKey=${apiKey}`;

    let mealUrl: string;
    let mealData: { meals?: MealDBRecipe[] } = {};

    if (query) {
      mealUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
        query
      )}`;
      const mealRes = await fetch(mealUrl);
      mealData = (await mealRes.json()) as { meals?: MealDBRecipe[] };
    } else {
      // Fetch multiple random meals
      const randomRecipePromises = Array(8)
        .fill(null)
        .map(async () => {
          const response = await fetch(MEALDB_RANDOM);
          const data = (await response.json()) as { meals?: MealDBRecipe[] };
          return data.meals?.[0];
        });

      const randomMeals = await Promise.all(randomRecipePromises);
      mealData = { meals: randomMeals.filter(Boolean) as MealDBRecipe[] };
    }

    // Fetch Spoonacular data
    const spoonRes = await fetch(spoonUrl);
    const results: UnifiedRecipe[] = [];

    const spoonacularLimit = 4;
    const mealdbLimit = 8;

    // Process Spoonacular
    if (spoonRes.ok) {
      const spoonData = (await spoonRes.json()) as {
        results?: SpoonacularRecipe[];
        recipes?: SpoonacularRecipe[];
      };

      const spoonRecipes = (spoonData.results || spoonData.recipes || [])
        .slice(0, spoonacularLimit)
        .map((r) => ({
          id: `s-${r.id}`,
          title: r.title,
          image: r.image,
          source: "Spoonacular",
          description:
            r.summary?.replace(/<[^>]+>/g, "").slice(0, 150) + "…" ||
            r.instructions?.slice(0, 150) + "…" ||
            "Description coming soon.",
          ingredients:
            r.extendedIngredients?.map((ing) =>
              `${ing.amount} ${ing.unit} ${ing.name}`.trim()
            ) || [],
          prep_time_minutes: r.preparationMinutes || 0,
          cook_time_minutes: r.cookingMinutes || 0,
          servings: r.servings || 0,
          difficulty_level: r.difficulty || "Medium",
          youtube_link: getYouTubeSearchLink(r.title),
        }));

      results.push(...spoonRecipes);
    }

    // Process MealDB
    if (mealData.meals?.length) {
      const mealRecipes = mealData.meals.slice(0, mealdbLimit).map((m) => {
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
          prep_time_minutes: 0,
          cook_time_minutes: 0,
          servings: 0,
          difficulty_level: "Medium",
          youtube_link: m.strYoutube || getYouTubeSearchLink(m.strMeal),
        };
      });

      results.push(...mealRecipes);
    }

    // Shuffle for random queries
    if (!query) {
      results.sort(() => Math.random() - 0.5);
    }

    // Limit total results
    const finalResults = results.slice(0, 12);

    // Cache for 3 minutes
    cache[cacheKey] = { data: finalResults, expires: now + 3 * 60 * 1000 };

    return NextResponse.json(finalResults);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("API Error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
