// app/recipes/page.tsx
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RecipeList from "@/components/RecipeList";
import Navbar from "@/components/Navbar";

function RecipesContent() {
  const searchParams = useSearchParams();

  // Read all filters from URL
  const filters = {
    query: searchParams.get("query") || "",
    cuisine: searchParams.get("cuisine") || "",
    difficulty: searchParams.get("difficulty") || "",
    country: searchParams.get("country") || "",
    mealType: searchParams.get("mealType") || "",
    diet: searchParams.get("diet") || "",
    time: searchParams.get("time") || "",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-7xl mx-auto mb-6 pt-6">
        <Navbar />
      </div>

      {/* Filter Bar Component */}

      {/* Recipe List */}
      <div className="container mx-auto py-8">
        <RecipeList {...filters} />
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RecipesContent />
    </Suspense>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-200" />
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-orange-500 absolute top-0 left-0" />
      </div>
      <p className="text-gray-600 font-medium animate-pulse">
        Loading delicious recipes...
      </p>
    </div>
  );
}
