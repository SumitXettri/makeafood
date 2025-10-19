// app/api/spoonacular/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const id = searchParams.get("id");

  if (!query && !id) {
    return NextResponse.json(
      { error: "Missing query or id parameter" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    let results: any[] = [];

    // ------------------------------
    // Case 1: Search by query
    // ------------------------------
    if (query) {
      // Spoonacular search
      const spoonRes = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=8&addRecipeInformation=true&fillIngredients=true&instructionsRequired=true&apiKey=${apiKey}`
      );
      if (spoonRes.ok) {
        const spoonData = await spoonRes.json();
        const spoonResults =
          spoonData.results?.map((r: any) => ({
            id: `spoonacular-${r.id}`,
            title: r.title,
            image: r.image,
            instructions:
              r.analyzedInstructions?.[0]?.steps
                ?.map((s: any) => s.step)
                .join(" ") ||
              r.instructions ||
              "Instructions coming soon.",
            category: r.dishTypes?.[0] || "Unknown",
            area: r.cuisines?.[0] || "Global",
            nutrition: r.nutrition || null,
            ingredients: r.extendedIngredients || [],
          })) || [];
        results.push(...spoonResults);
      }

      // MealDB search
      const mealRes = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
      );
      if (mealRes.ok) {
        const mealData = await mealRes.json();
        const mealResults =
          mealData.meals?.map((m: any) => ({
            id: `mealdb-${m.idMeal}`,
            title: m.strMeal,
            image: m.strMealThumb,
            instructions: m.strInstructions || "Instructions coming soon.",
            category: m.strCategory || "Unknown",
            area: m.strArea || "Global",
            nutrition: null, // MealDB has no nutrition
            ingredients: Array.from({ length: 20 })
              .map((_, i) => {
                const name = m[`strIngredient${i + 1}`];
                const measure = m[`strMeasure${i + 1}`];
                if (name && name.trim()) {
                  return { name, amount: measure || "", unit: "" };
                }
                return null;
              })
              .filter(Boolean),
          })) || [];
        results.push(...mealResults);
      }

      return NextResponse.json({ results });
    }

    // ------------------------------
    // Case 2: Fetch single recipe by ID
    // ------------------------------
    if (id) {
      if (id.startsWith("spoonacular-")) {
        const realId = id.replace("spoonacular-", "");
        const spoonRes = await fetch(
          `https://api.spoonacular.com/recipes/${realId}/information?apiKey=${apiKey}&includeNutrition=false`
        );
        if (!spoonRes.ok) throw new Error("Spoonacular ID fetch failed");
        const r = await spoonRes.json();

        return NextResponse.json({
          id: `spoonacular-${r.id}`,
          title: r.title,
          image: r.image,
          instructions: r.instructions || "Instructions coming soon.",
          category: r.dishTypes?.[0] || "Unknown",
          area: r.cuisines?.[0] || "Global",
          nutrition: r.nutrition || null,
          ingredients:
            r.extendedIngredients?.map((ing: any) => ({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
            })) || [],
        });
      }

      if (id.startsWith("mealdb-")) {
        const realId = id.replace("mealdb-", "");
        const mealRes = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${realId}`
        );
        if (!mealRes.ok) throw new Error("MealDB ID fetch failed");
        const mealData = await mealRes.json();
        const m = mealData.meals?.[0];

        return NextResponse.json({
          id: `mealdb-${m.idMeal}`,
          title: m.strMeal,
          image: m.strMealThumb,
          instructions: m.strInstructions || "Instructions coming soon.",
          category: m.strCategory || "Unknown",
          area: m.strArea || "Global",
          nutrition: null,
          ingredients: Array.from({ length: 20 })
            .map((_, i) => {
              const name = m[`strIngredient${i + 1}`];
              const measure = m[`strMeasure${i + 1}`];
              if (name && name.trim()) {
                return { name, amount: measure || "", unit: "" };
              }
              return null;
            })
            .filter(Boolean),
        });
      }
    }
  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
