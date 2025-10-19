"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty_level: string | null;
  created_at: string;
  image_url: string | null;
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const RECIPES_PER_PAGE = 8;

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        let supabaseQuery = supabase
          .from("recipes")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .range((page - 1) * RECIPES_PER_PAGE, page * RECIPES_PER_PAGE - 1);

        if (query) {
          supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);
        }

        const { data, error } = await supabaseQuery;

        if (error) {
          console.error("Supabase error:", error);
          setNotFound(true);
          return;
        }

        setRecipes(data || []);
        setNotFound(!data || data.length === 0);
      } catch (err) {
        console.error("Fetch failed:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [query, page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900">
            {query
              ? `Search results for “${query}”`
              : "🍳 Discover Delicious Recipes"}
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            {query
              ? "Explore the best matches we found for your search."
              : "Browse the latest community recipes and cooking ideas."}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
          </div>
        )}

        {notFound && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥲</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No recipes found {query && `for “${query}”`}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Try searching for something else — like “pasta”, “curry”, or
              “chocolate cake”.
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <div className="group block h-[340px]">
                  <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full">
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="p-5 flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {recipe.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {recipe.description || "No description available."}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 mt-3">
                        {recipe.difficulty_level
                          ? `Difficulty: ${recipe.difficulty_level}`
                          : "Difficulty: N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-10 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-orange-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-orange-50"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
