// app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nepaliRecipes from "@/data/nepali-recipes.json"; // 🆕 Import Nepali recipes

interface RelatedRecipe {
  id: string;
  title: string;
  image: string;
  category?: string;
  area?: string;
  source?: string;
  servings?: number;
  difficulty_level?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  youtube_link?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MEALDB_LOOKUP = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";
const MEALDB_FILTER = "https://www.themealdb.com/api/json/v1/1/filter.php?c=";
const SPOONACULAR_INFO = "https://api.spoonacular.com/recipes";
const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

// Interfaces...
interface MealDBRecipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strYoutube?: string;
  strTags?: string;
  // Dynamic keys
  [key: `strIngredient${number}`]: string | undefined;
  [key: `strMeasure${number}`]: string | undefined;
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

interface DatabaseRecipe {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: unknown;
  instructions: unknown;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty_level: string | null;
  cuisine: string | null;
  tags: string[] | null;
  video_url: string | null;
}

function getYouTubeSearchLink(recipeTitle: string): string {
  const searchQuery = encodeURIComponent(`${recipeTitle} recipe`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
}

// 🆕 Updated to include Nepali
function getRecipeSource(
  id: string
): "database" | "mealdb" | "spoonacular" | "nepali" | "invalid" {
  if (!id) return "invalid";
  if (id.startsWith("db-")) return "database";
  if (id.startsWith("m-")) return "mealdb";
  if (id.startsWith("s-")) return "spoonacular";
  if (id.startsWith("n-")) return "nepali"; // 🆕

  const trimmedId = id.trim();
  if (/^\d+$/.test(trimmedId) && !isNaN(Number(trimmedId))) {
    return "database";
  }
  return "invalid";
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  console.log("=== Recipe API Debug ===");
  console.log("Received ID:", id);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const source = getRecipeSource(id);
  console.log("Detected Source:", source);

  try {
    // ===========================
    // 🇳🇵 NEPALI JSON Recipe
    // ===========================
    if (source === "nepali") {
      console.log("🇳🇵 Fetching from NEPALI JSON...");

      const meal = nepaliRecipes.meals.find((m) => m.idMeal === id);

      if (!meal) {
        return NextResponse.json(
          { error: "Nepali recipe not found" },
          { status: 404 }
        );
      }

      // Extract ingredients
      const ingredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = (meal as any)[`strIngredient${i}`];
        const measure = (meal as any)[`strMeasure${i}`];
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
        source: "Nepali Recipe Collection",
        ingredients,
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 4,
        difficulty_level: "Medium",
        youtube_link: meal.strYoutube || getYouTubeSearchLink(meal.strMeal),
      };

      // Related Nepali recipes
      let related = nepaliRecipes.meals
        .filter((r) => r.strCategory === meal.strCategory && r.idMeal !== id)
        .slice(0, 6)
        .map((r) => ({
          id: r.idMeal,
          title: r.strMeal,
          image: r.strMealThumb,
          youtube_link: r.strYoutube || getYouTubeSearchLink(r.strMeal),
        }));

      if (!related.length) {
        related = nepaliRecipes.meals
          .filter((r) => r.idMeal !== id)
          .slice(0, 6)
          .map((r) => ({
            id: r.idMeal,
            title: r.strMeal,
            image: r.strMealThumb,
            youtube_link: r.strYoutube || getYouTubeSearchLink(r.strMeal),
          }));
      }

      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🗄️ DATABASE Recipe
    // ===========================
    if (source === "database") {
      console.log("📊 Fetching from DATABASE...");

      const numericId = id.startsWith("db-")
        ? parseInt(id.replace(/^db-/, ""), 10)
        : parseInt(id, 10);

      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: "Invalid database recipe ID" },
          { status: 400 }
        );
      }

      const supRes = await supabase
        .from("recipes")
        .select("*")
        .eq("id", numericId)
        .single();

      const dbData = supRes.data as DatabaseRecipe | null;

      if (!dbData || supRes.error) {
        return NextResponse.json(
          { error: "Recipe not found in database" },
          { status: 404 }
        );
      }

      // Parse ingredients
      let ingredients: string[] = [];
      const parsePossibleJSON = (val: unknown): unknown => {
        if (typeof val !== "string") return val;
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      };

      if (dbData.ingredients) {
        const parsed = parsePossibleJSON(dbData.ingredients);
        if (Array.isArray(parsed)) {
          ingredients = parsed.map((i) => String(i).trim()).filter(Boolean);
        } else if (typeof parsed === "object" && parsed !== null) {
          ingredients = Object.values(parsed)
            .map((v) => String(v).trim())
            .filter(Boolean);
        } else {
          const s = String(parsed);
          ingredients = s
            .split(/\r?\n|,/)
            .map((p) => p.trim())
            .filter(Boolean);
        }
      }

      // Parse instructions
      let instructionsNormalized: string | string[] =
        "No instructions available.";
      if (dbData.instructions) {
        const parsedInst = parsePossibleJSON(dbData.instructions);
        if (Array.isArray(parsedInst)) {
          instructionsNormalized = parsedInst
            .map((i) => String(i).trim())
            .filter(Boolean);
        } else if (typeof parsedInst === "string") {
          instructionsNormalized = String(parsedInst).trim();
        }
      }

      const recipe = {
        id: `db-${numericId}`,
        title: String(dbData.title ?? "Untitled"),
        image: String(dbData.image_url ?? ""),
        category: String(dbData.cuisine ?? "N/A"),
        area: String(dbData.cuisine ?? "Unknown"),
        instructions: instructionsNormalized,
        description: String(dbData.description ?? ""),
        source: "MakeAFood Database",
        ingredients,
        prep_time_minutes: Number(dbData.prep_time_minutes ?? 0),
        cook_time_minutes: Number(dbData.cook_time_minutes ?? 0),
        servings: Number(dbData.servings ?? 0),
        difficulty_level: dbData.difficulty_level ?? "Medium",
        youtube_link:
          dbData.video_url ?? getYouTubeSearchLink(String(dbData.title ?? "")),
        tags: dbData.tags ?? null,
      };

      // Get related
      let related: {
        id: string;
        title: string;
        image: string;
        youtube_link: string;
      }[] = [];

      if (dbData.cuisine) {
        const { data: relatedData } = await supabase
          .from("recipes")
          .select("id, title, image_url")
          .eq("cuisine", dbData.cuisine)
          .neq("id", numericId)
          .limit(6);

        if (relatedData) {
          related = (relatedData as DatabaseRecipe[]).map((r) => ({
            id: `db-${r.id}`,
            title: String(r.title ?? ""),
            image: String(r.image_url ?? ""),
            youtube_link: getYouTubeSearchLink(String(r.title ?? "")),
          }));
        }
      }

      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🍳 MEALDB Recipe
    // ===========================
    if (source === "mealdb") {
      const mealId = id.replace("m-", "");
      const res = await fetch(`${MEALDB_LOOKUP}${mealId}`);
      const data = (await res.json()) as MealDBResponse;

      if (!data.meals?.length) {
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }

      const meal = data.meals[0];
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

      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🥘 SPOONACULAR Recipe
    // ===========================

    if (source === "spoonacular") {
      const spoonId = id.replace("s-", "");

      // Fetch main recipe info
      const res = await fetch(
        `${SPOONACULAR_INFO}/${spoonId}/information?apiKey=${SPOONACULAR_KEY}`
      );
      if (!res.ok) throw new Error("Failed to fetch Spoonacular recipe");
      const data = (await res.json()) as SpoonacularRecipe;

      // Build full image URL (default size: 636x393)
      const imageUrl = data.image?.startsWith("http")
        ? data.image
        : `https://spoonacular.com/recipeImages/${data.image}`;

      const recipe: RelatedRecipe = {
        id,
        title: data.title,
        image: imageUrl,
        category: data.dishTypes?.[0] || "N/A",
        area: data.cuisines?.[0] || "Unknown",
        source: "Spoonacular",

        prep_time_minutes: data.preparationMinutes || 0,
        cook_time_minutes: data.cookingMinutes || 0,
        servings: data.servings || 0,
        difficulty_level: data.difficulty || "Medium",
        youtube_link: getYouTubeSearchLink(data.title),
      };

      // Fetch similar recipes for "related"
      const relatedRes = await fetch(
        `${SPOONACULAR_INFO}/${spoonId}/similar?apiKey=${SPOONACULAR_KEY}&number=6`
      );

      let related: RelatedRecipe[] = [];
      if (relatedRes.ok) {
        const relatedData = (await relatedRes.json()) as SpoonacularRecipe[];
        related = relatedData.map((r) => ({
          id: `s-${r.id}`,
          title: r.title,
          // Build full image URL for each related recipe
          image: r.image?.startsWith("http")
            ? r.image
            : `https://spoonacular.com/recipeImages/${r.image}`,
          youtube_link: getYouTubeSearchLink(r.title),
        }));
      }

      return NextResponse.json({ recipe, related });
    }

    return NextResponse.json(
      { error: "Invalid recipe ID format" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
