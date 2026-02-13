// app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// 🇳🇵 GitHub URL for Nepali recipes JSON
const NEPALI_RECIPES_URL =
  "https://raw.githubusercontent.com/SumitXettri/NepaliRecipe/main/recipes.json";

const MEALDB_LOOKUP = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";
const MEALDB_FILTER = "https://www.themealdb.com/api/json/v1/1/filter.php?c=";
const SPOONACULAR_INFO = "https://api.spoonacular.com/recipes";
const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

// 🆕 Cache for Nepali recipes
let nepaliRecipesCache: { meals: MealDBRecipe[] } | null = null;
let nepaliRecipesCacheExpiry = 0;

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
  original?: string;
}

interface SpoonacularStep {
  number: number;
  step: string;
}

interface SpoonacularInstruction {
  name?: string;
  steps: SpoonacularStep[];
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  dishTypes?: string[];
  cuisines?: string[];
  summary?: string;
  instructions?: string | SpoonacularInstruction[];
  analyzedInstructions?: SpoonacularInstruction[];
  extendedIngredients?: SpoonacularIngredient[];
  preparationMinutes?: number;
  cookingMinutes?: number;
  servings?: number;
  difficulty?: string;
  spoonacularScore?: number;
  sourceUrl?: string;
  readyInMinutes?: number;
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

// 🆕 Fetch Nepali recipes from GitHub with caching
async function fetchNepaliRecipesFromGitHub(): Promise<{
  meals: MealDBRecipe[];
} | null> {
  try {
    const now = Date.now();

    // Check cache (cache for 1 hour)
    if (nepaliRecipesCache && nepaliRecipesCacheExpiry > now) {
      console.log("✅ Using cached Nepali recipes");
      return nepaliRecipesCache;
    }

    console.log("🔄 Fetching Nepali recipes from GitHub...");
    const response = await fetch(NEPALI_RECIPES_URL);

    if (!response.ok) {
      console.error("❌ Failed to fetch Nepali recipes:", response.statusText);
      return null;
    }

    const jsonData = await response.json();
    nepaliRecipesCache = jsonData;
    nepaliRecipesCacheExpiry = now + 60 * 60 * 1000; // Cache for 1 hour

    console.log(
      "✅ Nepali recipes loaded from GitHub:",
      jsonData.meals?.length || 0
    );
    return jsonData;
  } catch (error) {
    console.error("❌ Error fetching Nepali recipes:", error);
    return null;
  }
}

function getRecipeSource(
  id: string
): "database" | "mealdb" | "spoonacular" | "nepali" | "invalid" {
  if (!id) return "invalid";
  if (id.startsWith("db-")) return "database";
  if (id.startsWith("m-")) return "mealdb";
  if (id.startsWith("s-")) return "spoonacular";
  if (id.startsWith("n-")) return "nepali"; // 🆕 Handle n- prefix

  // For numeric IDs without prefix, we'll check nepali first, then database
  const trimmedId = id.trim();
  if (/^\d+$/.test(trimmedId)) {
    return "nepali";
  }

  return "invalid";
}

// Helper function to handle database recipes
async function handleDatabaseRecipe(dbData: DatabaseRecipe, numericId: number) {
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

  let instructionsNormalized: string | string[] = "No instructions available.";
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

  // Get related recipes
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
    // 🇳🇵 NEPALI JSON Recipe (from GitHub)
    // ===========================
    if (source === "nepali") {
      console.log("🇳🇵 Checking NEPALI JSON (GitHub)...");

      const nepaliRecipes = await fetchNepaliRecipesFromGitHub();

      if (nepaliRecipes && nepaliRecipes.meals) {
        // The GitHub JSON already has IDs with 'n-' prefix, so use the full ID
        console.log(
          "🔍 Available Nepali recipe IDs:",
          nepaliRecipes.meals.map((m) => m.idMeal)
        );
        console.log("🔍 Looking for ID:", id);

        const meal = nepaliRecipes.meals.find((m) => m.idMeal === id);

        if (meal) {
          console.log("✅ Found in Nepali recipes");

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
            id: meal.idMeal, // Use the ID from the meal (already has n- prefix)
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
            .filter(
              (r) =>
                r.strCategory === meal.strCategory && r.idMeal !== meal.idMeal
            )
            .slice(0, 6)
            .map((r) => ({
              id: r.idMeal, // IDs already have n- prefix
              title: r.strMeal,
              image: r.strMealThumb,
              youtube_link: r.strYoutube || getYouTubeSearchLink(r.strMeal),
            }));

          if (!related.length) {
            related = nepaliRecipes.meals
              .filter((r) => r.idMeal !== meal.idMeal)
              .slice(0, 6)
              .map((r) => ({
                id: r.idMeal, // IDs already have n- prefix
                title: r.strMeal,
                image: r.strMealThumb,
                youtube_link: r.strYoutube || getYouTubeSearchLink(r.strMeal),
              }));
          }

          return NextResponse.json({ recipe, related });
        }
      }

      // Not found in Nepali recipes, try database
      console.log("⚠️ Not in Nepali recipes, checking database...");
      const numericId = parseInt(
        id.startsWith("n-") ? id.replace("n-", "") : id,
        10
      );
      if (!isNaN(numericId)) {
        const supRes = await supabase
          .from("recipes")
          .select("*")
          .eq("id", numericId)
          .single();

        if (supRes.data && !supRes.error) {
          console.log("✅ Found in database");
          return handleDatabaseRecipe(supRes.data as DatabaseRecipe, numericId);
        }
      }

      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
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

      return handleDatabaseRecipe(dbData, numericId);
    }

    // ===========================
    // 🍳 MEALDB Recipe
    // ===========================
    if (source === "mealdb") {
      console.log("🍳 Fetching from MEALDB...");
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
      console.log("🥘 Fetching from SPOONACULAR...");
      const spoonId = id.replace("s-", "");

      const res = await fetch(
        `${SPOONACULAR_INFO}/${spoonId}/information?apiKey=${SPOONACULAR_KEY}`
      );
      if (!res.ok) throw new Error("Failed to fetch Spoonacular recipe");
      const data = (await res.json()) as SpoonacularRecipe;

      const imageUrl = data.image?.startsWith("http")
        ? data.image
        : `https://spoonacular.com/recipeImages/${data.image}`;

      const ingredients: string[] = [];
      if (data.extendedIngredients && Array.isArray(data.extendedIngredients)) {
        data.extendedIngredients.forEach((ing) => {
          const amount = ing.amount || "";
          const unit = ing.unit || "";
          const name = ing.name || "";

          const formatted =
            amount && unit
              ? `${amount} ${unit} ${name}`.trim()
              : amount
              ? `${amount} ${name}`.trim()
              : name;

          if (formatted) {
            ingredients.push(formatted);
          }
        });
      }

      let instructions: Array<{ step: number; description: string }> = [];

      if (data.instructions) {
        if (typeof data.instructions === "string") {
          const steps = data.instructions
            .split(/\r?\n|(?<=\.)\s+|\d+\.\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 10);

          instructions = steps.map((desc, idx) => ({
            step: idx + 1,
            description: desc,
          }));
        } else if (Array.isArray(data.instructions)) {
          instructions = data.instructions.map(
            (inst: unknown, idx: number) => ({
              step: idx + 1,
              description:
                typeof inst === "string"
                  ? inst
                  : String((inst as Record<string, unknown>).step || ""),
            })
          );
        }
      }

      if (instructions.length === 0 && data.analyzedInstructions) {
        const analyzed = Array.isArray(data.analyzedInstructions)
          ? data.analyzedInstructions[0]
          : data.analyzedInstructions;

        if (analyzed?.steps) {
          instructions = analyzed.steps.map((s: SpoonacularStep) => ({
            step: s.number,
            description: s.step,
          }));
        }
      }

      if (instructions.length === 0) {
        instructions = [
          {
            step: 1,
            description:
              "Instructions not available for this recipe. Please refer to the source website.",
          },
        ];
      }

      const recipe = {
        id,
        title: data.title,
        image: imageUrl,
        category: data.dishTypes?.[0] || "N/A",
        area: data.cuisines?.[0] || "Unknown",
        cuisine: data.cuisines?.[0] || "Unknown",
        source: "Spoonacular",
        description: data.summary
          ? data.summary.replace(/<[^>]*>/g, "").substring(0, 200) + "..."
          : "",
        ingredients,
        instructions,
        prep_time_minutes: data.preparationMinutes || 0,
        cook_time_minutes: data.cookingMinutes || 0,
        servings: data.servings || 0,
        difficulty_level: data.difficulty || "Medium",
        rating: data.spoonacularScore
          ? Math.round(data.spoonacularScore / 20)
          : 0,
        youtube_link: getYouTubeSearchLink(data.title),
        video_url: data.sourceUrl || undefined,
        tags: data.dishTypes || [],
      };

      const relatedRes = await fetch(
        `${SPOONACULAR_INFO}/${spoonId}/similar?apiKey=${SPOONACULAR_KEY}&number=6`
      );

      let related: RelatedRecipe[] = [];
      if (relatedRes.ok) {
        const relatedData = (await relatedRes.json()) as SpoonacularRecipe[];
        related = relatedData.map((r) => ({
          id: `s-${r.id}`,
          title: r.title,
          image: r.image?.startsWith("http")
            ? r.image
            : `https://spoonacular.com/recipeImages/${r.image}`,
          difficulty_level: "Medium",
          prep_time_minutes: 0,
          cook_time_minutes: 0,
          video_url: getYouTubeSearchLink(r.title),
        }));
      }

      return NextResponse.json({ recipe, related });
    }

    // Invalid source
    return NextResponse.json(
      { error: "Invalid recipe source" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error in recipe route:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
