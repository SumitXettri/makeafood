// lib/fetchRecipes.ts
export async function fetchRecipes(query: string) {
  try {
    const res = await fetch(
      `/api/spoonacular?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
      }
    );
    if (!res.ok) throw new Error(`Failed with ${res.status}`);

    const data = await res.json();
    return data.results || []; // already normalized in API route
  } catch (err) {
    console.error("fetchRecipes error:", err);
    return [];
  }
}

export async function fetchRecipeById(id: string) {
  try {
    const res = await fetch(`/api/spoonacular?id=${id}`, { method: "GET" });
    if (!res.ok) throw new Error(`Failed with ${res.status}`);

    return await res.json(); // already normalized
  } catch (err) {
    console.error("fetchRecipeById error:", err);
    return null;
  }
}
