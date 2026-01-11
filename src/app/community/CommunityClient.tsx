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

interface CommunityClientProps {
  initialQuery: string;
}

function CommunityClient({ initialQuery }: CommunityClientProps) {
  const [recipes, setRecipes] = useState<RecipeWithUser[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(initialQuery);
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
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest"); // newest, popular, trending

  // New states for trending data
  const [dailyTopRecipe, setDailyTopRecipe] = useState<RecipeWithUser | null>(
    null
  );
  const [weeklyTopRecipe, setWeeklyTopRecipe] = useState<RecipeWithUser | null>(
    null
  );
  const [monthlyTopRecipe, setMonthlyTopRecipe] =
    useState<RecipeWithUser | null>(null);
  const [topCreators, setTopCreators] = useState<
    Array<{ user: UserProfile; recipeCount: number; totalLikes: number }>
  >([]);

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

    // Apply sorting
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.likes - a.likes);
        break;
      case "trending":
        filtered = [...filtered].sort(
          (a, b) => b.likes + b.views - (a.likes + a.views)
        );
        break;
      case "oldest":
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "newest":
      default:
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    setFilteredRecipes(filtered);
  }, [recipes, searchInput, selectedCuisine, selectedDifficulty, sortBy]);
  const calculateTrendingRecipes = useCallback(
    (recipesData: RecipeWithUser[]) => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Daily top recipe
      const dailyRecipes = recipesData.filter(
        (r) => new Date(r.created_at) >= oneDayAgo
      );
      const dailyTop = dailyRecipes.sort(
        (a, b) => b.likes + b.views - (a.likes + a.views)
      )[0];
      setDailyTopRecipe(dailyTop || null);

      // Weekly top recipe
      const weeklyRecipes = recipesData.filter(
        (r) => new Date(r.created_at) >= oneWeekAgo
      );
      const weeklyTop = weeklyRecipes.sort(
        (a, b) => b.likes + b.views - (a.likes + a.views)
      )[0];
      setWeeklyTopRecipe(weeklyTop || null);

      // Monthly top recipe
      const monthlyRecipes = recipesData.filter(
        (r) => new Date(r.created_at) >= oneMonthAgo
      );
      const monthlyTop = monthlyRecipes.sort(
        (a, b) => b.likes + b.views - (a.likes + a.views)
      )[0];
      setMonthlyTopRecipe(monthlyTop || null);

      // Top creators
      const creatorMap = new Map<
        string,
        { user: UserProfile; recipeCount: number; totalLikes: number }
      >();
      recipesData.forEach((recipe) => {
        if (recipe.user_profile) {
          const existing = creatorMap.get(recipe.user_id);
          if (existing) {
            existing.recipeCount++;
            existing.totalLikes += recipe.likes || 0;
          } else {
            creatorMap.set(recipe.user_id, {
              user: recipe.user_profile,
              recipeCount: 1,
              totalLikes: recipe.likes || 0,
            });
          }
        }
      });

      const topCreatorsList = Array.from(creatorMap.values())
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 5);
      setTopCreators(topCreatorsList);
    },
    []
  );

  useEffect(() => {
    const initialize = async () => {
      try {
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

          const { data: likes } = await supabase
            .from("recipe_likes")
            .select("recipe_id")
            .eq("user_id", user.id);

          if (likes) {
            currentUserLikes = new Set(likes.map((l) => l.recipe_id));
            setUserLikes(currentUserLikes);
          }
        }

        setLoading(true);
        const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select("*")
          .eq("is_public", true)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (recipesError) throw recipesError;

        if (recipesData && recipesData.length > 0) {
          const recipeIds = recipesData.map((r) => r.id);
          const userIds = [...new Set(recipesData.map((r) => r.user_id))];

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

          const likeCountMap = new Map<number, number>();
          likeCounts?.forEach((like) => {
            likeCountMap.set(
              like.recipe_id,
              (likeCountMap.get(like.recipe_id) || 0) + 1
            );
          });

          const commentCountMap = new Map<number, number>();
          commentCounts?.forEach((comment) => {
            commentCountMap.set(
              comment.recipe_id,
              (commentCountMap.get(comment.recipe_id) || 0) + 1
            );
          });

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
          calculateTrendingRecipes(recipesWithUsers);
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
        () => {
          initialize();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [calculateTrendingRecipes]);

  useEffect(() => {
    filterRecipes();
  }, [
    searchInput,
    selectedCuisine,
    selectedDifficulty,
    recipes,
    sortBy,
    filterRecipes,
  ]);

  useEffect(() => {
    if (initialQuery) {
      setIsSearching(true);
      setSearchInput(initialQuery);
      // Simulate search delay for better UX
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  }, [initialQuery]);

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
    setSortBy("newest"); // Add this line
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

  const TrendingRecipeCard = ({
    recipe,
    period,
  }: {
    recipe: RecipeWithUser | null;
    period: string;
  }) => {
    if (!recipe) {
      return (
        <div className="text-center py-4 text-gray-400 text-sm">
          No {period} recipe yet
        </div>
      );
    }

    return (
      <Link href={`/recipe/${recipe.id}`} className="block group">
        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-400 text-white">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            🔥 {period}
          </div>
        </div>
        <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-2">
          {recipe.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {recipe.likes}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {recipe.views}
          </span>
        </div>
      </Link>
    );
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
  const RecipeCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>

      <div className="px-4 pb-3">
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      </div>

      <div className="relative w-full aspect-video bg-gray-200"></div>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex gap-3">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="sticky top-0 z-20 ">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3">
            <div className="space-y-2 sticky top-24">
              {/* User Profile */}
              {currentUser && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {currentUser.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={getUserDisplayName(currentUser)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">
                        {getUserDisplayName(currentUser)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {getUserDisplayName(currentUser)}
                  </span>
                </Link>
              )}

              {/* Navigation Items */}
              <Link
                href="/community"
                className="flex items-center gap-3 p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm">Feed</span>
              </Link>

              <Link
                href="/saved"
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 text-sm">Saved</span>
              </Link>

              <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
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
                </div>
                <span className="font-medium text-gray-700 text-sm">
                  Friends
                </span>
              </button>

              <Link
                href="/myrecipe"
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 text-sm">
                  My Recipes
                </span>
              </Link>

              <Link
                href="/notifications"
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 text-sm">
                  Notifications
                </span>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-300 my-3"></div>

              {/* Filters Section */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-orange-500"
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
                  Sort & Filter
                </h3>

                {/* Sort By */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Liked</option>
                    <option value="trending">Trending (Likes + Views)</option>
                  </select>
                </div>

                {/* Quick Filters */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Quick Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedCuisine("");
                        setSelectedDifficulty("easy");
                      }}
                      className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition"
                    >
                      🟢 Easy Recipes
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCuisine("nepali");
                        setSelectedDifficulty("");
                      }}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-medium transition"
                    >
                      🇳🇵 Nepali
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("popular");
                        setSelectedCuisine("");
                        setSelectedDifficulty("");
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition"
                    >
                      ⭐ Popular
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-3"></div>

                {/* Advanced Filters */}
                <details className="mb-3">
                  <summary className="text-xs font-semibold text-gray-700 mb-2 cursor-pointer hover:text-orange-600 transition">
                    Advanced Filters
                  </summary>

                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
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

                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        Difficulty
                      </label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">All Levels</option>
                        {difficulties.map((difficulty) => (
                          <option
                            key={difficulty}
                            value={difficulty.toLowerCase()}
                          >
                            {difficulty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </details>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-xs transition-colors"
                  >
                    Clear All ({activeFiltersCount})
                  </button>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
                  {filteredRecipes.length} of {recipes.length} recipes
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Feed */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Community Feed
                  </h1>
                  <p className="text-sm text-gray-600">
                    Discover recipes from our chefs
                  </p>
                </div>
                {searchInput && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    Searching: &quot;{searchInput}&quot;
                  </span>
                )}
              </div>
            </div>

            {isSearching ? (
              // Loading Skeleton
              <>
                <RecipeCardSkeleton />
                <RecipeCardSkeleton />
                <RecipeCardSkeleton />
              </>
            ) : filteredRecipes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
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
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
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
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 00-6.364 0z"
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

          {/* Right Sidebar - Trending & Top Creators */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="space-y-4 sticky top-24">
              {/* Top Creators */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Top Creators
                </h2>

                <div className="space-y-3">
                  {topCreators.length > 0 ? (
                    topCreators.map((creator, index) => (
                      <div
                        key={creator.user.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex-shrink-0 relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold">
                            {creator.user.avatar_url ? (
                              <img
                                src={creator.user.avatar_url}
                                alt={getUserDisplayName(creator.user)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">
                                {getUserDisplayName(creator.user)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {getUserDisplayName(creator.user)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {creator.recipeCount}{" "}
                            {creator.recipeCount === 1 ? "recipe" : "recipes"} •{" "}
                            {creator.totalLikes} likes
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No creators yet
                    </div>
                  )}
                </div>
              </div>
              {/* Trending Recipes */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Trending Recipes
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Today
                    </h3>
                    <TrendingRecipeCard
                      recipe={dailyTopRecipe}
                      period="Daily"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      This Week
                    </h3>
                    <TrendingRecipeCard
                      recipe={weeklyTopRecipe}
                      period="Weekly"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      This Month
                    </h3>
                    <TrendingRecipeCard
                      recipe={monthlyTopRecipe}
                      period="Monthly"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityClient;
