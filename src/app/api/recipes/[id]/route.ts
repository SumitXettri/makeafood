// app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";

const MEALDB_LOOKUP = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";
const MEALDB_FILTER = "https://www.themealdb.com/api/json/v1/1/filter.php?c=";
const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";
const SPOONACULAR_INFO = "https://api.spoonacular.com/recipes";
const SPOONACULAR_SEARCH = "https://api.spoonacular.com/recipes/complexSearch";
const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // ===========================
    // 🍳 MEALDB Recipe
    // ===========================
    if (id.startsWith("m-")) {
      const mealId = id.replace("m-", "");
      const res = await fetch(`${MEALDB_LOOKUP}${mealId}`);
      if (!res.ok) throw new Error("MealDB fetch failed");

      const data = await res.json();
      if (!data.meals?.length)
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );

      const meal = data.meals[0];

      // Extract ingredients from MealDB's numbered properties
      const ingredients = [];
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
        ingredients, // Add ingredients array
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 0,
      };

      // Fetch related by category
      let related: any[] = [];
      if (meal.strCategory) {
        const relRes = await fetch(`${MEALDB_FILTER}${meal.strCategory}`);
        const relData = await relRes.json();
        if (relData.meals) {
          related = relData.meals
            .filter((r: any) => r.idMeal !== mealId)
            .slice(0, 6)
            .map((r: any) => ({
              id: `mealdb-${r.idMeal}`,
              title: r.strMeal,
              image: r.strMealThumb,
            }));
        }
      }

      // Fallback: Random meal if no related found
      if (!related.length) {
        const randRes = await fetch(MEALDB_RANDOM);
        const randData = await randRes.json();
        if (randData.meals) {
          related = randData.meals.map((r: any) => ({
            id: `mealdb-${r.idMeal}`,
            title: r.strMeal,
            image: r.strMealThumb,
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
      const data = await res.json();

      const recipe = {
        id,
        title: data.title,
        image: data.image,
        category: data.dishTypes?.[0] || "N/A",
        area: data.cuisines?.[0] || "Unknown",
        instructions: data.instructions || "No instructions available.",
        source: "Spoonacular",
        ingredients:
          data.extendedIngredients?.map((ing: any) =>
            `${ing.amount} ${ing.unit} ${ing.name}`.trim()
          ) || [],
        prep_time_minutes: data.preparationMinutes || 0,
        cook_time_minutes: data.cookingMinutes || 0,
        servings: data.servings || 0,
      };

      // Fetch related recipes using Spoonacular's search API
      let related: any[] = [];
      const query = data.cuisines?.[0] || data.dishTypes?.[0] || "popular";

      const relRes = await fetch(
        `${SPOONACULAR_SEARCH}?apiKey=${SPOONACULAR_KEY}&query=${query}&number=6`
      );
      const relData = await relRes.json();

      if (relData.results) {
        related = relData.results
          .filter((r: any) => r.id !== Number(spoonId))
          .map((r: any) => ({
            id: `spoonacular-${r.id}`,
            title: r.title,
            image: r.image,
          }));
      }

      // Fallback: fetch random Spoonacular recipes if nothing found
      if (!related.length) {
        const randRes = await fetch(
          `${SPOONACULAR_SEARCH}?apiKey=${SPOONACULAR_KEY}&sort=random&number=6`
        );
        const randData = await randRes.json();
        if (randData.results) {
          related = randData.results.map((r: any) => ({
            id: `spoonacular-${r.id}`,
            title: r.title,
            image: r.image,
          }));
        }
      }

      return NextResponse.json({ recipe, related });
    }

    // ===========================
    // 🚫 Unknown ID
    // ===========================
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  } catch (err: any) {
    console.error("Error fetching recipe:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
