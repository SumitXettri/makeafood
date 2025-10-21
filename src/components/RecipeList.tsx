"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceReader from "./VoiceReader";

interface Recipe {
  id: string;
  title: string;
  image: string;
  source: string;
  description: string;
}

interface RecipeListProps {
  query?: string;
}

export default function RecipeList({ query = "" }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/recipes?query=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // Ensure data is an array
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

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
  }, [query]);

  if (loading) {
    return <p className="text-center mt-10">Loading recipes...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-red-500">{error}</p>;
  }

  if (!Array.isArray(recipes) || recipes.length === 0) {
    return <p className="text-center mt-10">No recipes found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          onClick={() => router.push(`/recipe/${recipe.id}`)} // Changed from /recipes/ to /recipe/
          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
        >
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold">{recipe.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{recipe.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              Source: {recipe.source}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
