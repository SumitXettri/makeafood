"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VoiceReader from "@/components/VoiceReader";
import { fetchRecipeById } from "@/lib/fetchRecipes";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  image: string;
  instructions: string;
  category: string;
  area: string;
  ingredients: Ingredient[];
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadRecipe = async () => {
      setLoading(true);
      const recipeData = await fetchRecipeById(id);
      if (recipeData) {
        setRecipe(recipeData);
        setError(null);
      } else {
        setError("Recipe not found");
      }
      setLoading(false);
    };
    loadRecipe();
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mb-3"></div>
        <p className="text-gray-600 text-sm font-medium">
          Loading your delicious recipe...
        </p>
      </div>
    );

  if (error || !recipe)
    return (
      <div className="max-w-2xl mx-auto p-6 text-center bg-white rounded-2xl shadow-lg mt-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {error || "Recipe Not Found"}
        </h2>
        <p className="text-gray-600 mb-5 text-sm">
          We couldn’t find the recipe you’re looking for.
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-lg my-6 transition-all duration-300 hover:shadow-xl">
      {/* Hero Image */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg mb-6 group">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
          onError={(e) => (e.currentTarget.src = "/fallback-recipe.jpg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight drop-shadow">
            {recipe.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-orange-600 text-white text-xs sm:text-sm font-medium px-3 py-1 rounded-full shadow-sm">
              {recipe.category}
            </span>
            <span className="bg-amber-500 text-white text-xs sm:text-sm font-medium px-3 py-1 rounded-full shadow-sm">
              {recipe.area}
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <section className="mb-8 p-4 bg-green-50 rounded-xl border border-green-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-green-600">🛒</span> Ingredients
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipe.ingredients.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow border-l-2 border-green-400 transition"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-sm text-gray-900 block leading-tight">
                    {item.name}
                  </strong>
                  <span className="text-gray-600 text-xs">
                    {item.amount} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instructions */}
      <section className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">👩‍🍳</span> Instructions
        </h2>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <VoiceReader text={recipe.instructions} />
        </div>
      </section>
    </div>
  );
}
