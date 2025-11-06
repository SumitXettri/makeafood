"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RecipeList from "@/components/RecipeList";
import Navbar from "@/components/Navbar";

// Create a separate component for the search functionality
function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || ""; // empty = random

  return <RecipeList query={query} />;
}

// Main page component
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}
