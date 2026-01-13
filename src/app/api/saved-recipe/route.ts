import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Service Role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// -------------------------
// POST: Save a recipe
// -------------------------
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipeId } = await req.json();
    if (!recipeId)
      return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

    // Fetch recipe snapshot
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, title, image")
      .eq("id", recipeId)
      .single();

    if (recipeError || !recipe)
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    // Save recipe for user (handle duplicates)
    const { error: insertError } = await supabase.from("saved_recipes").insert({
      user_id: user.id,
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      recipe_image: recipe.image ?? null,
    });

    if (insertError) {
      // Unique constraint violation (already saved)
      if (insertError.code === "23505")
        return NextResponse.json({ success: true });
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /saved-recipe error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// -------------------------
// DELETE: Remove a saved recipe
// -------------------------
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get("recipeId");
    if (!recipeId)
      return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /saved-recipe error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// -------------------------
// GET: Check if a recipe is saved
// -------------------------
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ saved: false });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) return NextResponse.json({ saved: false });

    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get("recipeId");
    if (!recipeId) return NextResponse.json({ saved: false });

    const { data } = await supabase
      .from("saved_recipes")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId)
      .maybeSingle(); // Use maybeSingle() to avoid 404 if no row

    return NextResponse.json({ saved: !!data });
  } catch (err) {
    console.error("GET /saved-recipe error:", err);
    return NextResponse.json({ saved: false });
  }
}
