"use client";
import { useSearchParams } from "next/navigation";
import RecipeList from "@/components/RecipeList";
import Navbar from "@/components/Navbar";

export default function RecipesPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || ""; // empty = random

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <RecipeList query={query} />
    </div>
  );
}
