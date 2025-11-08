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

// In-memory cache
const cache: Record<string, { data: UnifiedRecipe[]; expires: number }> = {};
const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";

// Helper: generate YouTube search link
function getYouTubeSearchLink(recipeTitle: string): string {
  const searchQuery = encodeURIComponent(`${recipeTitle} recipe`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
}

// 🧠 Weighted Scoring Algorithm
function calculateScore(
  r: UnifiedRecipe,
  q: string,
  genre?: string | null,
  difficulty?: string | null
): number {
   
  let score = 0;

  if (q && r.title.toLowerCase().includes(q)) score += 4;
  if (q && r.description.toLowerCase().includes(q)) score += 2;
  if (genre && r.title.toLowerCase().includes(genre.toLowerCase())) score += 3;
  if (genre && r.description.toLowerCase().includes(genre.toLowerCase()))
    score += 1;
  if (difficulty) {
    const d = r.difficulty_level.toLowerCase();
    if (d === difficulty.toLowerCase()) score += 2;
  }
  if (r.servings > 3) score += 1;
  if (r.prep_time_minutes + r.cook_time_minutes < 30) score += 0.5;

  return score;
}

function rankRecipes(
  recipes: UnifiedRecipe[],
  query: string,
  genre?: string | null,
  difficulty?: string | null
): UnifiedRecipe[] {
  const q = query.toLowerCase();

  const scored = recipes.map((r) => ({
    ...r,
    score: calculateScore(r, q, genre, difficulty),
  }));

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...rest }) => rest);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const apiKey = process.env.SPOONACULAR_API_KEY;
  const genre = searchParams.get("genre");
  const difficulty = searchParams.get("difficulty");

  const cacheKey = query + (genre || "") + (difficulty || "");
  const now = Date.now();

  // Return cached data if valid
  if (cache[cacheKey] && cache[cacheKey].expires > now) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    const spoonUrl =
      query || genre
        ? `https://api.spoonacular.com/recipes/complexSearch?${new URLSearchParams(
            {
              query: query || "",
              cuisine: genre || "",
              number: "8",
              addRecipeInformation: "true",
              instructionsRequired: "true",
              fillIngredients: "true",
              apiKey: apiKey || "",
            }
          ).toString()}`
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

    const spoonRes = await fetch(spoonUrl);
    const results: UnifiedRecipe[] = [];

    // Process Spoonacular
    if (spoonRes.ok) {
      const spoonData = (await spoonRes.json()) as {
        results?: SpoonacularRecipe[];
        recipes?: SpoonacularRecipe[];
      };

      const spoonRecipes = (spoonData.results || spoonData.recipes || []).map(
        (r) => ({
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
        })
      );

      results.push(...spoonRecipes);
    }

    // Process MealDB
    if (mealData.meals?.length) {
      const mealRecipes = mealData.meals.map((m) => {
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

    // 🔍 Apply ranking algorithm
    const rankedResults =
      query || genre || difficulty
        ? rankRecipes(results, query, genre, difficulty)
        : results.sort(() => Math.random() - 0.5);

    // Limit & cache
    const finalResults = rankedResults.slice(0, 12);
    cache[cacheKey] = { data: finalResults, expires: now + 3 * 60 * 1000 };

    return NextResponse.json(finalResults);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("API Error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
