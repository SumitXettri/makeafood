import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client using service role or anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // or anon key if preferred
);

// Helper to get user from token
async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

// POST: Save a recipe
export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipeId } = await req.json();
  if (!recipeId)
    return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

  const { error: insertError } = await supabase.from("saved_recipes").insert({
    user_id: user.id,
    recipe_id: recipeId,
  });

  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

// DELETE: Unsave a recipe
export async function DELETE(req: Request) {
  const user = await getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get("recipeId");
  if (!recipeId)
    return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

  const { error: deleteError } = await supabase
    .from("saved_recipes")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId);

  if (deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

// GET: Check if a recipe is saved
export async function GET(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ saved: false });

  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get("recipeId");
  if (!recipeId) return NextResponse.json({ saved: false });

  const { data } = await supabase
    .from("saved_recipes")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .single();

  return NextResponse.json({ saved: !!data });
}
