"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VoiceReader from "@/components/VoiceReader";

interface Recipe {
  id: string;
  title: string;
  image: string;
  category: string;
  area: string;
  instructions: string;
  source: string;
  description: string;
}

interface RelatedRecipe {
  id: string;
  title: string;
  image: string;
}

// Separate RelatedRecipes component
function RelatedRecipes({ recipes }: { recipes: RelatedRecipe[] }) {
  const router = useRouter();

  // Don't return null, instead show a message or nothing
  if (!recipes?.length) {
    return (
      <div className="mt-12 text-center text-gray-500">
        No related recipes available
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">Related Recipes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => router.push(`/recipe/${recipe.id}`)}
            className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:scale-[1.02] transition-transform"
          >
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-3">
              <h3 className="text-md font-medium text-gray-800 line-clamp-2">
                {recipe.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecipeDetails() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [related, setRelated] = useState<RelatedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipe() {
      if (!params?.id) {
        setError("No recipe ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/recipes/${params.id}`);
        const data = await res.json();

        // Add debug logging
        console.log("API Response:", data);

        if (data.error) throw new Error(data.error);

        setRecipe(data.recipe);

        // Add more detailed checking for related recipes
        if (data.related) {
          console.log("Related recipes:", data.related);
          setRelated(Array.isArray(data.related) ? data.related : []);
        } else {
          console.log("No related recipes in response");
          setRelated([]);
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch recipe");
        setRecipe(null);
        setRelated([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [params?.id]);

  if (loading)
    return <p className="text-center mt-10">Loading recipe details...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!recipe) return <p className="text-center mt-10">Recipe not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="px-4 py-2 mb-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        ← Back
      </button>

      {/* Main recipe section */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-72 object-cover rounded-xl shadow-md"
        />
        <h1 className="text-3xl font-bold mt-6">{recipe.title}</h1>
        <p className="text-gray-600 mt-2">
          Category: {recipe.category} | Cuisine: {recipe.area}
        </p>
        <VoiceReader text={recipe.instructions} />
        <p className="mt-6 text-sm text-gray-500">Source: {recipe.source}</p>
      </div>

      {/* Always render RelatedRecipes component */}
      <RelatedRecipes recipes={related} />
    </div>
  );
}
