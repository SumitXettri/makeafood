"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  comment_count: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Comment {
  id: number;
  recipe_id: number;
  user_id: string;
  content: string;
  created_at: string;
  user_profile?: UserProfile;
}

interface RecipeWithUser extends DatabaseRecipe {
  user_profile?: UserProfile;
  isLikedByUser?: boolean;
}

function CommunityPage() {
  const [recipes, setRecipes] = useState<RecipeWithUser[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());

  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{
    [key: number]: boolean;
  }>({});
  const [submittingComment, setSubmittingComment] = useState<{
    [key: number]: boolean;
  }>({});

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

  const filterRecipes = useCallback(() => {
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
  }, [recipes, searchInput, selectedCuisine, selectedDifficulty]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Step 1: Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let currentUserLikes = new Set<number>();

        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();
          setCurrentUser(userData);

          // Step 2: Fetch user's likes
          const { data: likes } = await supabase
            .from("recipe_likes")
            .select("recipe_id")
            .eq("user_id", user.id);

          if (likes) {
            currentUserLikes = new Set(likes.map((l) => l.recipe_id));
            setUserLikes(currentUserLikes);
          }
        }

        // Step 3: Fetch recipes (now we have the likes)
        setLoading(true);
        const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select("*")
          .eq("is_public", true)
          .eq("is_approved", true) // ✅ ONLY SHOW APPROVED RECIPES
          .order("created_at", { ascending: false });

        console.log("Fetched recipes:", recipesData);

        if (recipesError) throw recipesError;

        if (recipesData && recipesData.length > 0) {
          const recipeIds = recipesData.map((r) => r.id);
          const userIds = [...new Set(recipesData.map((r) => r.user_id))];

          // Fetch users, likes, and comments in parallel
          const [usersData, likeCounts, commentCounts] = await Promise.all([
            supabase
              .from("users")
              .select("id, username, email, avatar_url, bio")
              .in("id", userIds)
              .then(({ data }) => data),
            supabase
              .from("recipe_likes")
              .select("recipe_id")
              .in("recipe_id", recipeIds)
              .then(({ data }) => data),
            supabase
              .from("comments")
              .select("recipe_id")
              .in("recipe_id", recipeIds)
              .then(({ data }) => data),
          ]);

          // Count likes per recipe
          const likeCountMap = new Map<number, number>();
          likeCounts?.forEach((like) => {
            likeCountMap.set(
              like.recipe_id,
              (likeCountMap.get(like.recipe_id) || 0) + 1
            );
          });

          // Count comments per recipe
          const commentCountMap = new Map<number, number>();
          commentCounts?.forEach((comment) => {
            commentCountMap.set(
              comment.recipe_id,
              (commentCountMap.get(comment.recipe_id) || 0) + 1
            );
          });

          // Build final recipes array with all data
          const recipesWithUsers: RecipeWithUser[] = recipesData.map(
            (recipe) => ({
              ...recipe,
              likes: likeCountMap.get(recipe.id) || 0,
              comment_count: commentCountMap.get(recipe.id) || 0,
              user_profile: usersData?.find((u) => u.id === recipe.user_id),
              isLikedByUser: currentUserLikes.has(recipe.id),
            })
          );

          setRecipes(recipesWithUsers);
          setFilteredRecipes(recipesWithUsers);
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const subscription = supabase
      .channel("recipe-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
          filter: "is_public=eq.true",
        },
        (payload) => {
          console.log("Recipe change detected:", payload);
          // Refetch recipes when changes occur
          initialize();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [
    searchInput,
    selectedCuisine,
    selectedDifficulty,
    recipes,
    filterRecipes,
  ]);

  const handleLike = async (recipeId: number) => {
    if (!currentUser) {
      alert("Please sign in to like recipes");
      return;
    }

    const isLiked = userLikes.has(recipeId);

    try {
      if (isLiked) {
        await supabase
          .from("recipe_likes")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("user_id", currentUser.id);

        setUserLikes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recipeId);
          return newSet;
        });

        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId
              ? { ...r, likes: Math.max(0, r.likes - 1), isLikedByUser: false }
              : r
          )
        );
        setFilteredRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId
              ? { ...r, likes: Math.max(0, r.likes - 1), isLikedByUser: false }
              : r
          )
        );
      } else {
        await supabase.from("recipe_likes").insert({
          recipe_id: recipeId,
          user_id: currentUser.id,
        });

        setUserLikes((prev) => new Set(prev).add(recipeId));

        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId
              ? { ...r, likes: r.likes + 1, isLikedByUser: true }
              : r
          )
        );
        setFilteredRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId
              ? { ...r, likes: r.likes + 1, isLikedByUser: true }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like. Please try again.");
    }
  };

  const fetchComments = async (recipeId: number) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [recipeId]: true }));

      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];

        const { data: usersData } = await supabase
          .from("users")
          .select("id, username, email, avatar_url, bio")
          .in("id", userIds);

        const commentsWithUsers = commentsData.map((comment) => ({
          ...comment,
          user_profile: usersData?.find((u) => u.id === comment.user_id),
        }));

        setComments((prev) => ({ ...prev, [recipeId]: commentsWithUsers }));
      } else {
        setComments((prev) => ({ ...prev, [recipeId]: [] }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [recipeId]: false }));
    }
  };

  const toggleComments = async (recipeId: number) => {
    const isCurrentlyShown = showComments[recipeId];
    setShowComments((prev) => ({ ...prev, [recipeId]: !isCurrentlyShown }));

    if (!isCurrentlyShown && !comments[recipeId]) {
      await fetchComments(recipeId);
    }
  };

  const handleAddComment = async (recipeId: number) => {
    if (!currentUser) {
      alert("Please sign in to comment");
      return;
    }

    const content = newComment[recipeId]?.trim();
    if (!content) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [recipeId]: true }));

      const { data, error } = await supabase
        .from("comments")
        .insert({
          recipe_id: recipeId,
          user_id: currentUser.id,
          content: content,
        })
        .select()
        .single();

      if (error) throw error;

      const newCommentWithUser = {
        ...data,
        user_profile: currentUser,
      };

      setComments((prev) => ({
        ...prev,
        [recipeId]: [newCommentWithUser, ...(prev[recipeId] || [])],
      }));

      setNewComment((prev) => ({ ...prev, [recipeId]: "" }));

      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, comment_count: (r.comment_count || 0) + 1 }
            : r
        )
      );
      setFilteredRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, comment_count: (r.comment_count || 0) + 1 }
            : r
        )
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [recipeId]: false }));
    }
  };

  const handleShare = async (recipe: RecipeWithUser) => {
    const shareData = {
      title: recipe.title,
      text: recipe.description || "Check out this recipe!",
      url: `${window.location.origin}/recipe/${recipe.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Recipe link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
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

  const getUserDisplayName = (profile?: UserProfile): string => {
    if (!profile) return "Anonymous";
    if (profile.username) return profile.username;
    if (profile.email) return profile.email.split("@")[0];
    return "Chef";
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
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
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
    <div className="min-h-screen bg-[#FFF9ED]">
      <div className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
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

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                >
                  Clear Filters ({activeFiltersCount})
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                {filteredRecipes.length} of {recipes.length} recipes
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
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
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold">
                        {recipe.user_profile?.avatar_url ? (
                          <img
                            src={recipe.user_profile.avatar_url}
                            alt={getUserDisplayName(recipe.user_profile)}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {getUserDisplayName(recipe.user_profile)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {getUserDisplayName(recipe.user_profile)}
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

                  {recipe.image_url && (
                    <div className="relative w-full aspect-video bg-gray-200">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

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

                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(recipe.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          recipe.isLikedByUser
                            ? "text-red-500"
                            : "text-gray-600 hover:text-red-500"
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill={recipe.isLikedByUser ? "currentColor" : "none"}
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

                      <button
                        onClick={() => toggleComments(recipe.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                      >
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {recipe.comment_count || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => handleShare(recipe)}
                        className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
                      >
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
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>

                    <Link
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

                  {showComments[recipe.id] && (
                    <div className="px-4 py-3 bg-gray-50">
                      {currentUser && (
                        <div className="mb-4">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {currentUser.avatar_url ? (
                                <img
                                  src={currentUser.avatar_url}
                                  alt={currentUser.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm">
                                  {currentUser.username.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={newComment[recipe.id] || ""}
                                onChange={(e) =>
                                  setNewComment((prev) => ({
                                    ...prev,
                                    [recipe.id]: e.target.value,
                                  }))
                                }
                                placeholder="Write a comment..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                rows={2}
                              />
                              <button
                                onClick={() => handleAddComment(recipe.id)}
                                disabled={
                                  !newComment[recipe.id]?.trim() ||
                                  submittingComment[recipe.id]
                                }
                                className="mt-2 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {submittingComment[recipe.id]
                                  ? "Posting..."
                                  : "Post"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {loadingComments[recipe.id] ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Loading comments...
                        </div>
                      ) : comments[recipe.id]?.length > 0 ? (
                        <div className="space-y-3">
                          {comments[recipe.id].map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {comment.user_profile?.avatar_url ? (
                                  <img
                                    src={comment.user_profile.avatar_url}
                                    alt={getUserDisplayName(
                                      comment.user_profile
                                    )}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm">
                                    {getUserDisplayName(comment.user_profile)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 bg-white rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {getUserDisplayName(comment.user_profile)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {getTimeAgo(comment.created_at)}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-3 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
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
