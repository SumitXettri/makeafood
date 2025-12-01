// app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// ----------------------
// 🔹 Helper Functions
// ----------------------

function getYouTubeSearchLink(recipeTitle: string): string {
  const searchQuery = encodeURIComponent(`${recipeTitle} recipe`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
}

// 🆕 Better ID type detection (accept "db-" prefix too)
function getRecipeSource(
  id: string
): "database" | "mealdb" | "spoonacular" | "invalid" {
  if (!id) return "invalid";

  // Accept explicit prefixes
  if (id.startsWith("db-")) return "database"; // <- accept db- prefixed DB ids
  if (id.startsWith("m-")) return "mealdb";
  if (id.startsWith("s-")) return "spoonacular";

  // Numeric (plain) IDs -> database
  const trimmedId = id.trim();
  if (/^\d+$/.test(trimmedId) && !isNaN(Number(trimmedId))) {
    return "database";
  }

  return "invalid";
}

// ----------------------
// 🔹 API Route Handler
// ----------------------

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 🔍 Debug logging (remove in production)
  console.log("=== Recipe API Debug ===");
  console.log("Received ID:", id);
  console.log("ID Type:", typeof id);
  console.log("ID Length:", id?.length);

  if (!id) {
    console.error("❌ No ID provided");
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Determine recipe source
  const source = getRecipeSource(id);
  console.log("Detected Source:", source);

  try {
    // ===========================
    // 🗄️ SUPABASE DATABASE Recipe
    // ===========================
    if (getRecipeSource(id) === "database") {
      console.log("📊 Fetching from DATABASE...");

      // support both "db-123" and plain "123"
      const numericId = id.startsWith("db-")
        ? parseInt(id.replace(/^db-/, ""), 10)
        : parseInt(id, 10);

      if (isNaN(numericId)) {
        console.error("❌ Invalid numeric ID:", id);
        return NextResponse.json(
          { error: "Invalid database recipe ID" },
          { status: 400 }
        );
      }

      // use a single response object to avoid accidental boolean / unexpected shapes
      const supRes = await supabase
        .from("recipes")
        .select("*")
        .eq("id", numericId)
        .single();

      console.log("Supabase raw response:", supRes);

      const dbData = supRes.data as DatabaseRecipe | null;
      const dbError = supRes.error;

      if (dbError || !dbData) {
        console.error("Supabase query failed:", dbError);
        return NextResponse.json(
          { error: "Recipe not found in database" },
          { status: 404 }
        );
      }

      // --- Normalize ingredients ---
      let ingredients: string[] = [];
      const rawIngredients = dbData.ingredients;

      const parsePossibleJSON = (val: unknown): unknown => {
        if (typeof val !== "string") return val;
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      };

      if (rawIngredients !== undefined && rawIngredients !== null) {
        const parsed = parsePossibleJSON(rawIngredients);

        if (Array.isArray(parsed)) {
          ingredients = parsed.map((i) => String(i).trim()).filter(Boolean);
        } else if (typeof parsed === "object" && parsed !== null) {
          ingredients = Object.values(parsed)
            .map((v) => String(v).trim())
            .filter(Boolean);
        } else {
          // string fallback: split on newline or comma
          const s = String(parsed);
          ingredients = s
            .split(/\r?\n|,/)
            .map((p) => p.trim())
            .filter(Boolean);
        }
      }

      // --- Normalize instructions (string | array | JSON-string) ---
      let instructionsNormalized: string | string[] =
        "No instructions available.";
      const rawInstructions = dbData.instructions;
      if (rawInstructions !== undefined && rawInstructions !== null) {
        const parsedInst = parsePossibleJSON(rawInstructions);
        if (Array.isArray(parsedInst)) {
          instructionsNormalized = parsedInst
            .map((i) => String(i).trim())
            .filter(Boolean);
        } else if (typeof parsedInst === "string") {
          // keep as string if long text, page will split by newlines
          instructionsNormalized = String(parsedInst).trim();
        } else if (typeof parsedInst === "object") {
          // object -> ordered values
          const obj = parsedInst as Record<string, unknown>;
          const ordered = Object.keys(obj)
            .sort()
            .map((k) => String(obj[k] ?? "").trim())
            .filter(Boolean);
          if (ordered.length) instructionsNormalized = ordered;
        }
      }

      const recipe = {
        id: `db-${numericId}`, // normalized id format
        title: String(dbData.title ?? "Untitled"),
        image: String(dbData.image_url ?? ""),
        category: String(dbData.cuisine ?? "N/A"),
        area: String(dbData.cuisine ?? "Unknown"),
        instructions: instructionsNormalized,
        description:
          String(dbData.description ?? "").trim() ||
          (typeof instructionsNormalized === "string"
            ? instructionsNormalized.slice(0, 150) +
              (String(instructionsNormalized).length > 150 ? "…" : "")
            : ""),
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

      // related: keep existing logic but ensure IDs are prefixed `db-`
      let related: {
        id: string;
        title: string;
        image: string;
        youtube_link: string;
      }[] = [];

      if ((dbData as any).cuisine) {
        const { data: relatedData } = await supabase
          .from("recipes")
          .select("id, title, image_url")
          .eq("cuisine", (dbData as any).cuisine)
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

      if (!related.length) {
        const { data: randomData } = await supabase
          .from("recipes")
          .select("id, title, image_url")
          .neq("id", numericId)
          .limit(6);

        if (randomData) {
          related = (randomData as DatabaseRecipe[]).map((r) => ({
            id: `db-${r.id}`,
            title: String(r.title ?? ""),
            image: String(r.image_url ?? ""),
            youtube_link: getYouTubeSearchLink(String(r.title ?? "")),
          }));
        }
      }

      console.log(
        "✅ Returning database recipe:",
        recipe.title,
        "related:",
        related.length
      );
      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🍳 MEALDB Recipe
    // ===========================
    if (source === "mealdb") {
      console.log("🍳 Fetching from MEALDB...");

      const mealId = id.replace("m-", "");
      const res = await fetch(`${MEALDB_LOOKUP}${mealId}`);

      if (!res.ok) {
        console.error("❌ MealDB API error:", res.status);
        throw new Error("MealDB fetch failed");
      }

      const data = (await res.json()) as MealDBResponse;

      if (!data.meals?.length) {
        console.error("❌ No meal found in MealDB");
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }

      const meal = data.meals[0];
      console.log("✅ MealDB recipe found:", meal.strMeal);

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
    if (source === "spoonacular") {
      console.log("🥘 Fetching from SPOONACULAR...");

      const spoonId = id.replace("s-", "");
      const res = await fetch(
        `${SPOONACULAR_INFO}/${spoonId}/information?apiKey=${SPOONACULAR_KEY}`
      );

      if (!res.ok) {
        console.error("❌ Spoonacular API error:", res.status);
        throw new Error("Spoonacular fetch failed");
      }

      const data = (await res.json()) as SpoonacularRecipe;
      console.log("✅ Spoonacular recipe found:", data.title);

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
    console.error("❌ Invalid ID format:", id);
    return NextResponse.json(
      {
        error:
          "Invalid recipe ID format. Use numeric ID for database, 'm-' prefix for MealDB, or 's-' prefix for Spoonacular",
        receivedId: id,
        detectedSource: source,
      },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("❌ Error fetching recipe:", message);
    console.error(
      "Stack:",
      err instanceof Error ? err.stack : "No stack trace"
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
