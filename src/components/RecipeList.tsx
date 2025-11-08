"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Heart,
  Star,
  ChefHat,
  Sparkles,
  TrendingUp,
  Search,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

interface Recipe {
  id: string;
  title: string;
  image: string;
  source: string;
  description: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  servings?: number;
  rating?: number;
  views?: number;
}

interface RecipeListProps {
  query?: string;
  genre?: string; // Add genre prop
}

export default function RecipeList({
  query = "",
  genre = "",
}: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (genre) params.set("genre", genre);

        const res = await fetch(`/api/recipes?${params.toString()}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // Ensure data is an array
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        console.log("Fetching recipes for query:", query);
        console.log("Received data:", data);

        setRecipes(data);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch recipes"
        );
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
  }, [query, genre]); // Add genre to dependency array

  const toggleFavorite = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(recipeId)) {
        newFavorites.delete(recipeId);
      } else {
        newFavorites.add(recipeId);
      }
      return newFavorites;
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600 bg-green-50";
      case "Medium":
        return "text-orange-600 bg-orange-50";
      case "Hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTotalTime = (recipe: Recipe) => {
    const prep = recipe.prep_time_minutes || 0;
    const cook = recipe.cook_time_minutes || 0;
    return prep + cook;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse"
              >
                <div className="h-56 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-red-500" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(recipes) || recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="text-orange-500" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No recipes found
          </h3>
          <p className="text-gray-600 mb-6">
            {query
              ? `We couldn't find any recipes matching "${query}". Try a different search term!`
              : "Start exploring by searching for your favorite dishes."}
          </p>
          <button
            onClick={() => router.push("/recipes")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            Explore Recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                {query ? (
                  <>
                    <Search className="text-orange-500" size={36} />
                    Search Results
                  </>
                ) : (
                  <>
                    <Sparkles className="text-orange-500" size={36} />
                    All Recipes
                  </>
                )}
              </h1>
              <p className="text-gray-600">
                {query
                  ? `Found ${recipes.length} recipe${
                      recipes.length !== 1 ? "s" : ""
                    } for "${query}"`
                  : `Discover ${recipes.length} amazing recipes`}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-xl hover:bg-orange-50 transition font-medium flex items-center gap-2">
                <TrendingUp size={18} />
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => {
            const totalTime = getTotalTime(recipe);
            const isFavorite = favorites.has(recipe.id);

            return (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    width={120}
                    height={120}
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    className={`absolute top-4 right-4 w-10 h-10 ${
                      isFavorite ? "bg-red-500" : "bg-white/90 backdrop-blur-sm"
                    } rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg z-10`}
                  >
                    <Heart
                      className={`${
                        isFavorite ? "text-white fill-white" : "text-red-500"
                      } cursor-pointer`}
                      size={20}
                    />
                  </button>

                  {/* Difficulty Badge */}
                  {recipe.difficulty_level && (
                    <div className="absolute top-4 left-4 cursor-default">
                      <span
                        className={`px-3 py-1 ${getDifficultyColor(
                          recipe.difficulty_level
                        )} rounded-full text-xs font-semibold backdrop-blur-sm`}
                      >
                        {recipe.difficulty_level}
                      </span>
                    </div>
                  )}

                  {/* Time Badge */}
                  {totalTime > 0 && (
                    <div className="absolute bottom-4 left-4 cursor-default">
                      <div className="flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                        <Clock size={14} className="text-orange-500" />
                        <span>{totalTime} min</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 cursor-pointer">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition line-clamp-2">
                    {recipe.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {recipe.description || "Delicious recipe to try at home"}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      {recipe.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star
                            className="text-yellow-500 fill-yellow-500"
                            size={16}
                          />
                          <span className="font-semibold text-gray-700">
                            {recipe.rating}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {recipe.servings ? recipe.servings : "1"} serving
                      </div>
                    </div>

                    <ChevronRight
                      className="text-orange-500 group-hover:translate-x-1 transition-transform"
                      size={20}
                    />
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Load More Button (Optional) */}
        {recipes.length >= 12 && (
          <div className="mt-12 text-center">
            <button className="px-8 py-4 bg-white border-2 border-orange-200 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 hover:border-orange-300 transition-all hover:scale-105">
              Load More Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
