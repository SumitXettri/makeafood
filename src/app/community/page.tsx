"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DatabaseRecipe {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty_level: string | null;
  is_public: boolean;
  created_at: string;
  image_url: string | null;
  cuisine: string | null;
  tags: string[] | null;
  likes: number;
  views: number;
  rating: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

interface RecipeWithUser extends DatabaseRecipe {
  user_profile?: UserProfile;
}

function CommunityPage() {
  const [recipes, setRecipes] = useState<RecipeWithUser[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  const cuisines = [
    "Nepali",
    "Italian",
    "Chinese",
    "Mexican",
    "Japanese",
    "French",
    "Thai",
    "Indian",
    "Mediterranean",
    "Korean",
    "Vietnamese",
  ];
  const difficulties = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    fetchCommunityRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchInput, selectedCuisine, selectedDifficulty, recipes]);

  const fetchCommunityRecipes = async () => {
    try {
      setLoading(true);

      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;

      if (recipesData && recipesData.length > 0) {
        const userIds = [...new Set(recipesData.map((r) => r.user_id))];

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, email, avatar_url, bio")
          .in("id", userIds);

        if (usersError) {
          console.error("Could not fetch users:", usersError);
        }

        const recipesWithUsers: RecipeWithUser[] = recipesData.map(
          (recipe) => ({
            ...recipe,
            user_profile: usersData?.find((u) => u.id === recipe.user_id),
          })
        );

        setRecipes(recipesWithUsers);
        setFilteredRecipes(recipesWithUsers);
      }
    } catch (error) {
      console.error("Error fetching community recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (searchInput.trim()) {
      const term = searchInput.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(term) ||
          recipe.description?.toLowerCase().includes(term) ||
          recipe.user_profile?.username?.toLowerCase().includes(term) ||
          recipe.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (selectedCuisine) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.cuisine?.toLowerCase() === selectedCuisine.toLowerCase()
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.difficulty_level?.toLowerCase() ===
          selectedDifficulty.toLowerCase()
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    filterRecipes();
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSelectedCuisine("");
    setSelectedDifficulty("");
  };

  const activeFiltersCount = [
    searchInput,
    selectedCuisine,
    selectedDifficulty,
  ].filter(Boolean).length;

  const getUserDisplayName = (recipe: RecipeWithUser): string => {
    if (recipe.user_profile?.username) {
      return recipe.user_profile.username;
    }
    if (recipe.user_profile?.email) {
      return recipe.user_profile.email.split("@")[0];
    }
    return `Chef ${recipe.user_id.slice(0, 6)}`;
  };

  const getTotalTime = (recipe: DatabaseRecipe): number => {
    return (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "hard":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: past.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-200" />
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-orange-500 absolute top-0 left-0" />
          </div>
          <p className="text-gray-600 font-medium animate-pulse">
            Loading community feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <div className="sticky top-0 z-20 ">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-30">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
              </h2>

              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Cuisine */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine
                </label>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Cuisines</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine.toLowerCase()}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Levels</option>
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty.toLowerCase()}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                >
                  Clear Filters ({activeFiltersCount})
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                Showing recipes
              </div>
            </div>
          </div>

          {/* Center Feed - Recipe Posts */}
          <div className="lg:col-span-6 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-orange-500"
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
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Community Feed
                  </h1>
                  <p className="text-sm text-gray-600">
                    Discover recipes from our chefs
                  </p>
                </div>
              </div>
            </div>

            {/* Recipe Feed */}
            {filteredRecipes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No recipes found
                </h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Post Header - User Info */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold">
                        {recipe.user_profile?.avatar_url ? (
                          <img
                            src={recipe.user_profile.avatar_url}
                            alt={getUserDisplayName(recipe)}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {getUserDisplayName(recipe).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {getUserDisplayName(recipe)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getTimeAgo(recipe.created_at)}
                        </p>
                      </div>
                    </div>
                    {recipe.difficulty_level && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                          recipe.difficulty_level
                        )}`}
                      >
                        {recipe.difficulty_level}
                      </span>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {recipe.title}
                    </h2>
                    {recipe.description && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  {/* Recipe Image */}
                  {recipe.image_url && (
                    <div className="relative w-full aspect-video bg-gray-200">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Recipe Details */}
                  <div className="px-4 py-3 border-t border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap gap-3 text-sm">
                      {getTotalTime(recipe) > 0 && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-4 h-4"
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
                            {getTotalTime(recipe)} min
                          </span>
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-4 h-4"
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
                          <span className="font-medium">
                            {recipe.servings} servings
                          </span>
                        </div>
                      )}
                      {recipe.cuisine && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {recipe.cuisine}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {recipe.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs text-gray-600 hover:text-orange-600 cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Engagement Bar */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {recipe.likes || 0}
                        </span>
                      </button>

                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {recipe.views || 0}
                        </span>
                      </button>

                      {recipe.rating > 0 && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span className="text-sm font-medium">
                            {recipe.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      key={recipe.id}
                      href={`/recipe/${recipe.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      View Recipe
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Sidebar - Stats */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-30">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Community Stats
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Recipes</span>
                  <span className="text-lg font-bold text-orange-600">
                    {recipes.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Chefs</span>
                  <span className="text-lg font-bold text-orange-600">
                    {new Set(recipes.map((r) => r.user_id)).size}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Likes</span>
                  <span className="text-lg font-bold text-orange-600">
                    {recipes.reduce((sum, r) => sum + (r.likes || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Views</span>
                  <span className="text-lg font-bold text-orange-600">
                    {recipes.reduce((sum, r) => sum + (r.views || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityPage;
