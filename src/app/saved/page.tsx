"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface SavedRecipe {
  id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_image: string | null;
  created_at: string;
}

export default function SavedRecipesPage() {
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    setLoading(true);

    // ✅ SAME LOGIC AS DASHBOARD
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUser(user);

    // ✅ Fetch only this user's saved recipes
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSaved(data);
    }

    setLoading(false);
  };

  if (loading) {
    return <p className="p-6 text-center">Loading saved recipes...</p>;
  }

  if (!user) {
    return (
      <p className="p-6 text-center">
        Please log in to view your saved recipes.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Saved Recipes</h1>

        {saved.length === 0 ? (
          <p className="text-gray-600">No saved recipes yet 🍽️</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {saved.length > 0 ? (
              saved.map((r) => (
                <Link
                  key={r.id}
                  href={`/recipe/${r.recipe_id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <img
                    src={r.recipe_image || "logo.svg"}
                    alt={r.recipe_title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {r.recipe_title}
                    </h3>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 mt-6">
                You haven't saved any recipes yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
