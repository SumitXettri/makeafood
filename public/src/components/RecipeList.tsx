"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Recipe {
  id: string;
  title: string;
  image: string;
  source: string;
  ingredients: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty_level: string;
  youtube_link: string;
  // Database-specific fields
  likes?: number;
  views?: number;
  rating?: number;
  tags?: string[];
  // NEW: Fuzzy search fields
  matchScore?: number;
  matchedKeywords?: string[];
  matchType?: "exact" | "partial" | "fuzzy" | "ingredient" | "tag";
}

interface RecipeListProps {
  query?: string;
  cuisine?: string;
  difficulty?: string;
  country?: string;
  mealType?: string;
  diet?: string;
  time?: string;
  tags?: string; // NEW: for tag-based filtering
}

interface APIResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  searchInfo?: {
    query: string;
    hasExactMatch: boolean;
    avgMatchScore: number;
  };
}

export default function RecipeList({
  query = "",
  cuisine = "",
  difficulty = "",
  country = "",
  mealType = "",
  diet = "",
  time = "",
  tags = "",
}: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInfo, setSearchInfo] = useState<
    APIResponse["searchInfo"] | null
  >(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError("");
      setPage(1);
      setHasMore(true);

      try {
        // Build query params for API
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (cuisine) params.set("genre", cuisine);
        if (difficulty) params.set("difficulty", difficulty);
        if (country) params.set("country", country);
        if (mealType) params.set("mealType", mealType);
        if (diet) params.set("diet", diet);
        if (time) params.set("time", time);
        if (tags) params.set("tags", tags); // NEW
        params.set("page", "1");
        params.set("limit", "12");

        const response = await fetch(`/api/recipes?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }

        const data: APIResponse = await response.json();

        // Handle both old format (array) and new format (object)
        if (Array.isArray(data)) {
          setRecipes(data);
          setHasMore(data.length === 12);
          setSearchInfo(null);
        } else {
          setRecipes(data.recipes || []);
          setHasMore(data.hasMore);
          setSearchInfo(data.searchInfo || null);
        }
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [query, cuisine, difficulty, country, mealType, diet, time, tags]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (cuisine) params.set("genre", cuisine);
      if (difficulty) params.set("difficulty", difficulty);
      if (country) params.set("country", country);
      if (mealType) params.set("mealType", mealType);
      if (diet) params.set("diet", diet);
      if (time) params.set("time", time);
      if (tags) params.set("tags", tags);
      params.set("page", (page + 1).toString());
      params.set("limit", "12");

      const response = await fetch(`/api/recipes?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch more recipes");
      }

      const data: APIResponse = await response.json();

      if (Array.isArray(data)) {
        setRecipes((prev) => [...prev, ...data]);
        setHasMore(data.length === 12);
      } else {
        setRecipes((prev) => [...prev, ...(data.recipes || [])]);
        setHasMore(data.hasMore);
      }

      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("Error loading more recipes:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-200" />
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-orange-500 absolute top-0 left-0" />
        </div>
        <p className="text-gray-600 font-medium animate-pulse">
          {query ? `Searching for "${query}"...` : "Loading recipes..."}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-red-500 text-6xl">⚠️</div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No results state
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-white rounded-2xl shadow-lg p-8 mx-4">
        <div className="text-gray-400 text-6xl mb-2">🔍</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          No recipes found
        </h3>
        {query && (
          <p className="text-gray-600 text-center max-w-md">
            We couldn&#39;t find any recipes matching{" "}
            <span className="font-semibold text-orange-600">&quot{query}&quot</span>
          </p>
        )}
        <p className="text-gray-500 text-sm text-center max-w-md mt-2">
          Try different keywords, check for typos, or remove some filters
        </p>
        <button
          onClick={() => (window.location.href = "/recipes")}
          className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-medium"
        >
          Clear Filters & Browse All
        </button>
      </div>
    );
  }

  // Group recipes by match quality for search results
  const exactMatches = recipes.filter((r) => (r.matchScore || 0) >= 100);
  const goodMatches = recipes.filter(
    (r) => (r.matchScore || 0) >= 50 && (r.matchScore || 0) < 100
  );
  const partialMatches = recipes.filter(
    (r) => (r.matchScore || 0) >= 20 && (r.matchScore || 0) < 50
  );
  const relatedRecipes = recipes.filter(
    (r) => (r.matchScore || 0) > 0 && (r.matchScore || 0) < 20
  );

  const hasSearchResults = query && query.trim().length > 0;
  const showGroupedResults =
    hasSearchResults && (exactMatches.length > 0 || goodMatches.length > 0);

  // Get difficulty badge color
  const getDifficultyColor = (level: string) => {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel === "easy")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (normalizedLevel === "medium")
      return "bg-amber-100 text-amber-700 border-amber-200";
    if (normalizedLevel === "hard")
      return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Get match type badge
  const getMatchBadge = (matchType?: string, matchScore?: number) => {
    if (!matchType || !matchScore || matchScore === 0) return null;

    if (matchScore >= 100) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-300">
          Perfect Match
        </span>
      );
    } else if (matchScore >= 50) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-300">
          Good Match
        </span>
      );
    } else if (matchType === "ingredient") {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-300">
          Ingredient Match
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-300">
          Similar
        </span>
      );
    }
  };

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <Link key={recipe.id} href={`/recipe/${recipe.id}`} className="group">
      <div
        title={recipe.title}
        className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-gray-100"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Match Badge (NEW) */}
          {hasSearchResults && recipe.matchScore && recipe.matchScore > 0 && (
            <div className="absolute top-3 right-3">
              {getMatchBadge(recipe.matchType, recipe.matchScore)}
            </div>
          )}

          {/* Stats overlay for Community recipes */}
          {recipe.source === "Community" &&
            (recipe.rating || recipe.likes || recipe.views) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                <div className="flex items-center gap-4">
                  {recipe.rating !== undefined && recipe.rating > 0 && (
                    <div className="flex items-center gap-1.5 text-white">
                      <svg
                        className="w-5 h-5 fill-yellow-400"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-lg">
                        {recipe.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {recipe.likes !== undefined && recipe.likes > 0 && (
                    <div className="flex items-center gap-1.5 text-white">
                      <svg className="w-5 h-5 fill-red-400" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-semibold">
                        {formatNumber(recipe.likes)}
                      </span>
                    </div>
                  )}
                  {recipe.views !== undefined && recipe.views > 0 && (
                    <div className="flex items-center gap-1.5 text-white">
                      <svg
                        className="w-5 h-5 fill-blue-300"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-semibold">
                        {formatNumber(recipe.views)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
            {recipe.title}
          </h3>

          {/* Matched Keywords (NEW) */}
          {hasSearchResults &&
            recipe.matchedKeywords &&
            recipe.matchedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {recipe.matchedKeywords.slice(0, 3).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium border border-orange-200"
                  >
                    {keyword.includes("~") ? keyword.split("~")[0] : keyword}
                  </span>
                ))}
              </div>
            )}

          {/* Tags (for Community recipes) */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {recipe.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-xs font-medium border border-gray-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {recipe.prep_time_minutes + recipe.cook_time_minutes > 0 && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {recipe.prep_time_minutes + recipe.cook_time_minutes}m
                  </span>
                </div>
              )}
              {recipe.servings > 0 && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">{recipe.servings}</span>
                </div>
              )}
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getDifficultyColor(
                recipe.difficulty_level
              )}`}
            >
              {recipe.difficulty_level}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Search Info Banner (NEW) */}
      {searchInfo && !searchInfo.hasExactMatch && recipes.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">
                Showing similar results
              </h4>
              <p className="text-yellow-700 text-sm">
                No exact matches for &ldquo;
                <span className="font-semibold">{searchInfo.query}</span>&ldquo;.
                These recipes are related to your search.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">
          {recipes.length} Recipe{recipes.length !== 1 ? "s" : ""} Found
        </h2>
        {searchInfo && searchInfo.avgMatchScore > 0 && (
          <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            Avg Match: {Math.round(searchInfo.avgMatchScore)}%
          </span>
        )}
      </div>

      {/* Grouped Results (NEW) */}
      {showGroupedResults ? (
        <div className="space-y-12">
          {/* Perfect Matches */}
          {exactMatches.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  Perfect Matches
                </span>
                <span className="text-gray-500 text-lg">
                  ({exactMatches.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {exactMatches.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {/* Good Matches */}
          {goodMatches.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  Good Matches
                </span>
                <span className="text-gray-500 text-lg">
                  ({goodMatches.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {goodMatches.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {/* Partial Matches */}
          {partialMatches.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <span className="bg-purple-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  Partial Matches
                </span>
                <span className="text-gray-500 text-lg">
                  ({partialMatches.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {partialMatches.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {/* Related Recipes */}
          {relatedRecipes.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <span className="bg-gray-400 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  Related Recipes
                </span>
                <span className="text-gray-500 text-lg">
                  ({relatedRecipes.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {relatedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Regular grid (no search or filters) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && recipes.length > 0 && (
        <div className="flex justify-center mt-12">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 group"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Loading more recipes...</span>
              </>
            ) : (
              <>
                <span>Load More Recipes</span>
                <svg
                  className="w-5 h-5 group-hover:translate-y-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* End of results message */}
      {!hasMore && recipes.length > 0 && (
        <div className="flex flex-col items-center justify-center mt-12 py-8 border-t border-gray-200">
          <div className="text-gray-400 text-4xl mb-3">🎉</div>
          <p className="text-gray-600 font-medium">
            You&apos;ve reached the end!
          </p>
          <p className="text-gray-500 text-sm mt-1">No more recipes to load</p>
        </div>
      )}
    </div>
  );
}
