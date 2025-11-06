// app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";

const MEALDB_LOOKUP = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";
const MEALDB_FILTER = "https://www.themealdb.com/api/json/v1/1/filter.php?c=";
const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";
const SPOONACULAR_INFO = "https://api.spoonacular.com/recipes";
const SPOONACULAR_SEARCH = "https://api.spoonacular.com/recipes/complexSearch";
const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

// ----------------------
// 🔹 Helper Interfaces
// ----------------------

interface MealDBRecipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strYoutube?: string;
  [key: string]: string | undefined;
}

interface MealDBResponse {
  meals?: MealDBRecipe[];
}

interface SpoonacularIngredient {
  amount: number;
  unit: string;
  name: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  dishTypes?: string[];
  cuisines?: string[];
  instructions?: string;
  extendedIngredients?: SpoonacularIngredient[];
  preparationMinutes?: number;
  cookingMinutes?: number;
  servings?: number;
  difficulty?: string;
}

interface SpoonacularResponse {
  results?: SpoonacularRecipe[];
}

// ----------------------
// 🔹 Helper Function
// ----------------------

function getYouTubeSearchLink(recipeTitle: string): string {
  const searchQuery = encodeURIComponent(`${recipeTitle} recipe`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
}

// ----------------------
// 🔹 API Route Handler
// ----------------------

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // ===========================
    // 🍳 MEALDB Recipe
    // ===========================
    if (id.startsWith("m-")) {
      const mealId = id.replace("m-", "");
      const res = await fetch(`${MEALDB_LOOKUP}${mealId}`);
      if (!res.ok) throw new Error("MealDB fetch failed");

      const data = (await res.json()) as MealDBResponse;
      if (!data.meals?.length)
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );

      const meal = data.meals[0];

      // Extract ingredients
      const ingredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
          ingredients.push(
            `${measure?.trim() || ""} ${ingredient.trim()}`.trim()
          );
        }
      }

      const recipe = {
        id,
        title: meal.strMeal,
        image: meal.strMealThumb,
        category: meal.strCategory,
        area: meal.strArea,
        instructions: meal.strInstructions,
        source: "MealDB",
        ingredients,
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 0,
        difficulty_level: "Medium",
        youtube_link: meal.strYoutube || getYouTubeSearchLink(meal.strMeal),
      };

      // Fetch related recipes
      let related: {
        id: string;
        title: string;
        image: string;
        youtube_link: string;
      }[] = [];

      if (meal.strCategory) {
        const relRes = await fetch(`${MEALDB_FILTER}${meal.strCategory}`);
        const relData = (await relRes.json()) as MealDBResponse;
        if (relData.meals) {
          related = relData.meals
            .filter((r) => r.idMeal !== mealId)
            .slice(0, 6)
            .map((r) => ({
              id: `m-${r.idMeal}`,
              title: r.strMeal,
              image: r.strMealThumb,
              youtube_link: getYouTubeSearchLink(r.strMeal),
            }));
        }
      }

      // Fallback: random meals
      if (!related.length) {
        const randRes = await fetch(MEALDB_RANDOM);
        const randData = (await randRes.json()) as MealDBResponse;
        if (randData.meals) {
          related = randData.meals.map((r) => ({
            id: `m-${r.idMeal}`,
            title: r.strMeal,
            image: r.strMealThumb,
            youtube_link: getYouTubeSearchLink(r.strMeal),
          }));
        }
      }

      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🥘 SPOONACULAR Recipe
    // ===========================
    if (id.startsWith("s-")) {
      const spoonId = id.replace("s-", "");
      const res = await fetch(
        `${SPOONACULAR_INFO}/${spoonId}/information?apiKey=${SPOONACULAR_KEY}`
      );
      if (!res.ok) throw new Error("Spoonacular fetch failed");

      const data = (await res.json()) as SpoonacularRecipe;

      const recipe = {
        id,
        title: data.title,
        image: data.image,
        category: data.dishTypes?.[0] || "N/A",
        area: data.cuisines?.[0] || "Unknown",
        instructions: data.instructions || "No instructions available.",
        source: "Spoonacular",
        ingredients:
          data.extendedIngredients?.map((ing) =>
            `${ing.amount} ${ing.unit} ${ing.name}`.trim()
          ) || [],
        prep_time_minutes: data.preparationMinutes || 0,
        cook_time_minutes: data.cookingMinutes || 0,
        servings: data.servings || 0,
        difficulty_level: data.difficulty || "Medium",
        youtube_link: getYouTubeSearchLink(data.title),
      };

      // Related recipes
      let related: {
        id: string;
        title: string;
        image: string;
        youtube_link: string;
      }[] = [];

      const query = data.cuisines?.[0] || data.dishTypes?.[0] || "popular";
      const relRes = await fetch(
        `${SPOONACULAR_SEARCH}?apiKey=${SPOONACULAR_KEY}&query=${query}&number=6`
      );
      const relData = (await relRes.json()) as SpoonacularResponse;

      if (relData.results) {
        related = relData.results
          .filter((r) => r.id !== Number(spoonId))
          .map((r) => ({
            id: `s-${r.id}`,
            title: r.title,
            image: r.image,
            youtube_link: getYouTubeSearchLink(r.title),
          }));
      }

      // Fallback: random Spoonacular
      if (!related.length) {
        const randRes = await fetch(
          `${SPOONACULAR_SEARCH}?apiKey=${SPOONACULAR_KEY}&sort=random&number=6`
        );
        const randData = (await randRes.json()) as SpoonacularResponse;
        if (randData.results) {
          related = randData.results.map((r) => ({
            id: `s-${r.id}`,
            title: r.title,
            image: r.image,
            youtube_link: getYouTubeSearchLink(r.title),
          }));
        }
      }

      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🚫 Invalid ID
    // ===========================
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("Error fetching recipe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
