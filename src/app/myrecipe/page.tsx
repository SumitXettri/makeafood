"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Recipe {
  id: number;
  title: string;
  image_url?: string;
  likes?: number;
  views?: number;
  created_at?: string;
}

export default function MyRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRecipes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("id, title, image_url, likes, views, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch user recipes:", error);
        setRecipes([]);
      } else {
        setRecipes(data || []);
      }
      setLoading(false);
    };

    fetchMyRecipes();
  }, []);

  if (loading) {
    return <p className="text-center mt-12">Loading your recipes...</p>;
  }

  if (recipes.length === 0) {
    return (
      <p className="text-center mt-12 text-gray-500">
        You haven’t added any recipes yet.
      </p>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Recipes</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/recipe/${r.id}`}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <img
              src={r.image_url || "/placeholder-recipe.jpg"}
              alt={r.title}
              className="h-48 w-full object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg line-clamp-2">{r.title}</h3>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{r.likes || 0} Likes</span>
                <span>{r.views || 0} Views</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
