// app/api/recipes/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🇳🇵 GitHub URL for Nepali recipes JSON (use raw.githubusercontent.com)
const NEPALI_RECIPES_URL = "https://raw.githubusercontent.com/SumitXettri/NepaliRecipe/main/recipes.json";

// Interfaces...
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
  strCategory?: string;
  strArea?: string;
  strTags?: string;
  [key: `strIngredient${number}`]: string | undefined;
  [key: `strMeasure${number}`]: string | undefined;
}

interface DatabaseRecipe {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty_level: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  video_url: string | null;
  ingredients: unknown;
  instructions: unknown;
  cuisine: string | null;
  tags: string[] | null;
  likes: number;
  views: number;
  rating: number;
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
  likes?: number;
  views?: number;
  rating?: number;
  tags?: string[];
}

const cache: Record<string, { data: UnifiedRecipe[]; expires: number }> = {};
// 🆕 Cache for Nepali recipes JSON
let nepaliRecipesCache: { meals: MealDBRecipe[] } | null = null;
let nepaliRecipesCacheExpiry = 0;

const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";

function getYouTubeSearchLink(recipeTitle: string): string {
  const searchQuery = encodeURIComponent(`${recipeTitle} recipe`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
}

function parseIngredients(ingredients: unknown): string[] {
  if (!ingredients) return [];

  if (Array.isArray(ingredients)) {
    if (ingredients.length === 0) return [];
    const first = ingredients[0];

    if (typeof first === "string") {
      return ingredients as string[];
    }

    return (ingredients as unknown[]).map((ing) => {
      if (ing && typeof ing === "object" && !Array.isArray(ing)) {
        const obj = ing as Record<string, unknown>;
        const amount = obj.amount ?? obj.quantity ?? obj.qty ?? "";
        const name =
          obj.name ?? obj.ingredient ?? obj.ingredientName ?? obj.item ?? "";
        return `${String(amount)} ${String(name)}`.trim();
      }
      return String(ing);
    });
  }

  if (typeof ingredients === "object" && !Array.isArray(ingredients)) {
    const obj = ingredients as Record<string, unknown>;
    return Object.values(obj)
      .filter(Boolean)
      .map((v) => String(v));
  }

  return [];
}

// 🇳🇵 NEW: Fetch Nepali recipes from GitHub
async function fetchNepaliRecipes(
  query?: string,
  category?: string | null
): Promise<UnifiedRecipe[]> {
  try {
    const now = Date.now();
    
    // Check cache (cache for 1 hour)
    if (nepaliRecipesCache && nepaliRecipesCacheExpiry > now) {
      console.log("✅ Using cached Nepali recipes");
    } else {
      console.log("🔄 Fetching Nepali recipes from GitHub...");
      const response = await fetch(NEPALI_RECIPES_URL);
      console.log("📡 GitHub response status:", response.status);
      
      if (!response.ok) {
        console.error("❌ Failed to fetch Nepali recipes from GitHub:", response.statusText);
        return [];
      }
      
      const jsonData = await response.json();
      console.log("📦 GitHub JSON data structure:", Object.keys(jsonData));
      console.log("📊 Number of meals:", jsonData.meals?.length || 0);
      
      nepaliRecipesCache = jsonData;
      nepaliRecipesCacheExpiry = now + 60 * 60 * 1000; // Cache for 1 hour
    }

    let filtered = nepaliRecipesCache?.meals || [];
    console.log("🔍 Total Nepali recipes available:", filtered.length);

    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (meal) =>
          meal.strMeal.toLowerCase().includes(q) ||
          meal.strTags?.toLowerCase().includes(q) ||
          meal.strCategory?.toLowerCase().includes(q)
      );
      console.log(`🔎 Filtered by query "${query}":`, filtered.length, "recipes");
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(
        (meal) => meal.strCategory?.toLowerCase() === category.toLowerCase()
      );
      console.log(`🏷️ Filtered by category "${category}":`, filtered.length, "recipes");
    }

    console.log("✨ Returning", filtered.length, "Nepali recipes");

    // Transform to UnifiedRecipe format
    return filtered.map((meal) => {
      // Extract ingredients
      const ingredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = (meal as MealDBRecipe)[`strIngredient${i}`];
        const measure = (meal as MealDBRecipe)[`strMeasure${i}`];

        if (ingredient && ingredient.trim()) {
          ingredients.push(
            `${measure?.trim() || ""} ${ingredient.trim()}`.trim()
          );
        }
      }

      return {
        id: meal.idMeal,
        title: meal.strMeal,
        image:
          meal.strMealThumb ||
          "https://via.placeholder.com/400x300?text=Nepali+Recipe",
        source: "Nepali Collection",
        description:
          meal.strInstructions?.slice(0, 150) + "…" ||
          "Authentic Nepali recipe.",
        ingredients,
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 4,
        difficulty_level: "Medium",
        youtube_link: meal.strYoutube || getYouTubeSearchLink(meal.strMeal),
        tags: meal.strTags?.split(",").map((t) => t.trim()) || ["Nepali"],
      };
    });
  } catch (error) {
    console.error("❌ Nepali recipes error:", error);
    return [];
  }
}

// Database recipes
async function fetchDatabaseRecipes(
  query?: string,
  genre?: string | null,
  difficulty?: string | null,
  country?: string | null,
  mealType?: string | null,
  diet?: string | null
): Promise<UnifiedRecipe[]> {
  try {
    let supabaseQuery = supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .eq("is_approved", true);

    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
      );
    }

    if (genre) {
      supabaseQuery = supabaseQuery.ilike("cuisine", `%${genre}%`);
    }

    if (country) {
      supabaseQuery = supabaseQuery.or(
        `cuisine.ilike.%${country}%,tags.cs.{${country}}`
      );
    }

    if (difficulty) {
      supabaseQuery = supabaseQuery.eq("difficulty_level", difficulty);
    }

    if (mealType) {
      supabaseQuery = supabaseQuery.contains("tags", [mealType.toLowerCase()]);
    }

    if (diet) {
      supabaseQuery = supabaseQuery.contains("tags", [diet.toLowerCase()]);
    }

    const { data, error } = await supabaseQuery
      .order("likes", { ascending: false })
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }

    return (data || []).map((recipe: DatabaseRecipe) => ({
      id: `db-${recipe.id}`,
      title: recipe.title,
      image:
        recipe.image_url || "https://via.placeholder.com/400x300?text=No+Image",
      source: "Community",
      description: recipe.description || "No description available.",
      ingredients: parseIngredients(recipe.ingredients),
      prep_time_minutes: recipe.prep_time_minutes || 0,
      cook_time_minutes: recipe.cook_time_minutes || 0,
      servings: recipe.servings || 0,
      difficulty_level: recipe.difficulty_level || "Medium",
      youtube_link: recipe.video_url || getYouTubeSearchLink(recipe.title),
      likes: recipe.likes,
      views: recipe.views,
      rating: recipe.rating,
      tags: recipe.tags || [],
    }));
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
}

function calculateScore(
  r: UnifiedRecipe,
  q: string,
  genre?: string | null,
  difficulty?: string | null
): number {
  let score = 0;

  if (r.source === "Nepali Collection") {
    score += 2;
    if (q && (q.includes("nepal") || q.includes("momo") || q.includes("dal"))) {
      score += 3;
    }
  }

  if (r.source === "Community") {
    score += 1;
    if (r.likes && r.likes > 10) score += 1;
    if (r.rating && r.rating >= 4.0) score += 1;
    if (r.views && r.views > 100) score += 0.5;
  }

  if (q && r.title.toLowerCase().includes(q)) score += 4;
  if (q && r.description.toLowerCase().includes(q)) score += 2;

  if (q && r.tags) {
    const matchingTags = r.tags.filter((tag) =>
      tag.toLowerCase().includes(q.toLowerCase())
    );
    score += matchingTags.length * 1.5;
  }

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
    .map(({ score: _score, ...rest }) => rest);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const query = params.get("query") ?? "";
    const apiKey = process.env.SPOONACULAR_API_KEY;
    const genre = params.get("genre");
    const difficulty = params.get("difficulty");
    const country = params.get("country");
    const mealType = params.get("mealType");
    const diet = params.get("diet");
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const limit = Math.max(1, Number(params.get("limit") ?? 12));

    const cacheKey =
      query +
      (genre || "") +
      (difficulty || "") +
      (country || "") +
      (mealType || "") +
      (diet || "") +
      `:p=${page}:l=${limit}`;
    const now = Date.now();

    if (cache[cacheKey] && cache[cacheKey].expires > now) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // Fetch from ALL sources including Nepali
    console.log("🚀 Starting recipe fetch...");
    const [spoonResults, mealResults, dbResults, nepaliResults] =
      await Promise.all([
        fetchSpoonacularRecipes(query, genre, apiKey),
        fetchMealDBRecipes(query),
        fetchDatabaseRecipes(query, genre, difficulty, country, mealType, diet),
        fetchNepaliRecipes(query, genre),
      ]);

    console.log("📊 Recipe counts:");
    console.log("  - Spoonacular:", spoonResults.length);
    console.log("  - MealDB:", mealResults.length);
    console.log("  - Database:", dbResults.length);
    console.log("  - Nepali:", nepaliResults.length);

    // Combine all results
    const allRecipes = [
      ...nepaliResults,
      ...dbResults,
      ...spoonResults,
      ...mealResults,
    ];

    console.log("📦 Total recipes before ranking:", allRecipes.length);

    // Apply ranking
    const rankedResults =
      query || genre || difficulty
        ? rankRecipes(allRecipes, query, genre, difficulty)
        : allRecipes.sort(() => Math.random() - 0.5);

    // Pagination
    const start = (page - 1) * limit;
    const finalResults = rankedResults.slice(start, start + limit);
    cache[cacheKey] = { data: finalResults, expires: now + 3 * 60 * 1000 };

    return NextResponse.json(finalResults);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("API Error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

// Spoonacular
async function fetchSpoonacularRecipes(
  query: string,
  genre: string | null,
  apiKey?: string
): Promise<UnifiedRecipe[]> {
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

    const spoonRes = await fetch(spoonUrl);
    if (!spoonRes.ok) return [];

    const spoonData = (await spoonRes.json()) as {
      results?: SpoonacularRecipe[];
      recipes?: SpoonacularRecipe[];
    };

    return (spoonData.results || spoonData.recipes || []).map((r) => ({
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
  } catch (error) {
    console.error("Spoonacular error:", error);
    return [];
  }
}

// MealDB
async function fetchMealDBRecipes(query: string): Promise<UnifiedRecipe[]> {
  try {
    let mealData: { meals?: MealDBRecipe[] } = {};

    if (query) {
      const mealUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
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

    if (!mealData.meals?.length) return [];

    return mealData.meals.map((m) => {
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
          m.strInstructions?.slice(0, 150) + "…" || "Description coming soon.",
        ingredients,
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 0,
        difficulty_level: "Medium",
        youtube_link: m.strYoutube || getYouTubeSearchLink(m.strMeal),
      };
    });
  } catch (error) {
    console.error("MealDB error:", error);
    return [];
  }
}