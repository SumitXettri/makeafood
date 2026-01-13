"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  Star,
  Printer,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  Volume2,
  Youtube,
  MessageSquare,
  User,
  Send,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AuthModal from "@/components/AuthModal";
import Navbar from "@/components/Navbar";

// Updated interfaces to match Supabase schema
interface Ingredient {
  order: number;
  item: string;
}

interface Instruction {
  step: number;
  description: string;
}

interface Recipe {
  id: string;
  title: string;
  image: string;
  category?: string;
  area?: string;
  cuisine?: string;
  tags?: string[];
  instructions: Instruction[] | string;
  ingredients: Ingredient[] | string;
  source?: string;
  description?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  rating?: number;
  views?: number;
  likes?: number;
  video_url?: string;
  youtube_link?: string;
  is_approved?: boolean;
  created_at?: string;
}

interface RelatedRecipe {
  id: string;
  title: string;
  image: string;
  difficulty_level?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  video_url?: string;
}

// Separate RelatedRecipes component
function RelatedRecipes({ recipes }: { recipes: RelatedRecipe[] }) {
  const router = useRouter();

  if (!recipes?.length) {
    return (
      <div className="mt-12 text-center py-12 bg-orange-50 rounded-2xl">
        <ChefHat className="text-orange-300 mx-auto mb-3" size={48} />
        <p className="text-gray-500">No related recipes available</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-orange-500" size={32} />
          You Might Also Like
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recipes.map((recipe) => {
          const totalTime =
            (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

          return (
            <div
              key={recipe.id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {totalTime > 0 && (
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1">
                      <Clock size={14} className="text-orange-500" />
                      {totalTime} min
                    </span>
                  </div>
                )}
                {recipe.video_url && (
                  <a
                    href={recipe.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  >
                    <Youtube className="text-white" size={20} />
                  </a>
                )}
              </div>
              <div
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="p-4 cursor-pointer"
              >
                <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition">
                  {recipe.title}
                </h3>
                {recipe.difficulty_level && (
                  <span
                    className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${
                      recipe.difficulty_level === "Easy"
                        ? "bg-green-50 text-green-600"
                        : recipe.difficulty_level === "Medium"
                        ? "bg-orange-50 text-orange-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {recipe.difficulty_level}
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">(
    "instructions"
  );
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const speak = (instructions: Instruction[]) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech not supported. Try Chrome or Edge.");
      return;
    }

    window.speechSynthesis.cancel();

    if (!instructions || instructions.length === 0) {
      alert("No instructions available to read.");
      return;
    }

    const textToRead = instructions
      .map((inst) => `Step ${inst.step}: ${inst.description}`)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Parse ingredients from JSONB - now handles simple array format
  const parseIngredients = useCallback((data: unknown): Ingredient[] => {
    if (!data) return [];

    // If already an array
    if (Array.isArray(data)) {
      // Check if it's array of objects with 'item' property
      if (
        data.length > 0 &&
        typeof data[0] === "object" &&
        "item" in (data[0] as object)
      ) {
        return data as Ingredient[];
      }
      // If it's an array of strings (simple format), convert to objects
      return (data as unknown[]).map((item, idx) => ({
        order: idx + 1,
        item: String(item),
      }));
    }

    // If it's a string, try to parse it
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return parseIngredients(parsed); // Recursive call
      } catch {
        // If parsing fails, split by newlines
        return data
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((item, idx) => ({
            order: idx + 1,
            item,
          }));
      }
    }

    return [];
  }, []);

  // Parse instructions from JSONB - now handles simple array format
  const parseInstructions = useCallback((data: unknown): Instruction[] => {
    if (!data) return [];

    // If already an array
    if (Array.isArray(data)) {
      // Check if it's array of objects with 'description' property
      if (
        data.length > 0 &&
        typeof data[0] === "object" &&
        "description" in (data[0] as object)
      ) {
        return data as Instruction[];
      }
      // If it's an array of strings (simple format), convert to objects
      return (data as unknown[]).map((item, idx) => ({
        step: idx + 1,
        description: String(item),
      }));
    }

    // If it's a string, try to parse it
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return parseInstructions(parsed); // Recursive call
      } catch {
        // If parsing fails, split by newlines
        return data
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((item, idx) => ({
            step: idx + 1,
            description: item,
          }));
      }
    }

    return [];
  }, []);

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
        console.log("Fetching recipe ID:", params.id);

        const data = await res.json();

        console.log("=== RECIPE DETAILS DEBUG ===");
        console.log("Full API Response:", data);
        console.log("Recipe Image:", data.recipe?.image);
        console.log("Recipe Title:", data.recipe?.title);
        console.log("Raw Ingredients:", data.recipe?.ingredients);
        console.log("Raw Instructions:", data.recipe?.instructions);

        if (data.error) throw new Error(data.error);

        // Parse JSONB fields properly
        const parsedRecipe = {
          ...data.recipe,
          ingredients: parseIngredients(data.recipe.ingredients),
          instructions: parseInstructions(data.recipe.instructions),
          tags: Array.isArray(data.recipe.tags) ? data.recipe.tags : [],
        };

        setRecipe(parsedRecipe);

        if (data.related) {
          console.log("Related recipes:", data.related);
          setRelated(Array.isArray(data.related) ? data.related : []);
        } else {
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
  }, [params?.id, parseIngredients, parseInstructions]);

  useEffect(() => {
    if (!recipe?.id) return;

    const fetchSavedStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsSaved(false);
        return;
      }

      try {
        const response = await fetch("/api/saved-recipe", {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ recipeId: recipe.id }),
        });

        const data = await response.json();
        setIsSaved(data.saved);
      } catch {
        setIsSaved(false);
      }
    };

    fetchSavedStatus();
  }, [recipe?.id]);

  useEffect(() => {
    if (!recipe?.id) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from("recipe_comments")
        .select(
          `
    id,
    content,
    created_at,
    user_id,
    users ( username, avatar_url )
  `
        )
        .eq("recipe_id", recipe.id)
        .order("created_at", { ascending: false });

      if (data) setComments(data);
    };

    fetchComments();
  }, [recipe?.id]);

  const addComment = async () => {
    if (!recipe || !commentText.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    setCommentLoading(true);

    const newComment = {
      recipe_id: recipe.id,
      user_id: user.id,
      content: commentText.trim(),
    };

    const { data, error } = await supabase
      .from("recipe_comments")
      .insert(newComment)
      .select(
        `
      id,
      content,
      created_at,
      user_id,
      users ( username, avatar_url )
    `
      )
      .single();

    if (!error && data) {
      // 🔥 Instantly show comment
      setComments((prev) => [data, ...prev]);
      setCommentText("");
    } else {
      console.error("Failed to post comment:", error);
    }

    setCommentLoading(false);
  };

  const toggleSave = async () => {
    if (!recipe) return;

    // Check if user is authenticated
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    // Get the session token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error("No access token available");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/saved-recipe", {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      if (response.ok) {
        setIsSaved((prev) => !prev);
      } else {
        const text = await response.text();
        console.error("Save failed:", response.status, text);
      }
    } catch (error) {
      console.error("Error saving/unsaving recipe:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-orange-100 text-orange-700";
      case "Hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="h-96 bg-gray-200"></div>
              <div className="p-8 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="text-red-500" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Recipe Not Found
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/recipes"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600">Recipe not found.</p>
        </div>
      </div>
    );
  }

  // Parse ingredients and instructions
  const ingredients = parseIngredients(recipe.ingredients);
  const instructions = parseInstructions(recipe.instructions);

  // Use video_url if available, otherwise youtube_link for backwards compatibility
  const videoUrl = recipe.video_url || recipe.youtube_link;
  const recipeImage = recipe.image || "/placeholder-recipe.jpg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 px-5 py-2.5 bg-white border border-orange-200 text-gray-700 rounded-xl hover:bg-orange-50 font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {/* Main recipe card */}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-[400px] sm:h-[500px] overflow-hidden">
            <img
              title={recipe.title}
              src={recipeImage}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            {/* YouTube button on hero image - bottom right */}
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute z-10 cursor-pointer bottom-6 right-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-2 transition-all shadow-2xl hover:shadow-red-500/50 hover:scale-105 group"
              >
                <Youtube className="text-white" size={24} />
                <span className="text-white font-semibold text-lg">
                  Watch Tutorial
                </span>
              </a>
            )}

            {/* Floating action buttons */}
            <div className="absolute top-6 right-6 flex gap-3">
              <button
                onClick={toggleSave}
                disabled={saving}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
                  isSaved ? "bg-orange-500" : "bg-white/90 backdrop-blur-sm"
                }`}
              >
                <Heart
                  size={22}
                  className={
                    isSaved ? "text-white fill-white" : "text-orange-500"
                  }
                />
              </button>

              <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg">
                <Share2 className="text-gray-700" size={22} />
              </button>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.cuisine && (
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-800">
                    {recipe.cuisine}
                  </span>
                )}
                {recipe.category && (
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-800">
                    {recipe.category}
                  </span>
                )}
                {recipe.area && (
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-800">
                    {recipe.area}
                  </span>
                )}
                {recipe.difficulty_level && (
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getDifficultyColor(
                      recipe.difficulty_level
                    )}`}
                  >
                    {recipe.difficulty_level}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                {recipe.title}
              </h1>
              {/* {recipe.description && (
                <p className="text-white/90 text-lg max-w-3xl drop-shadow">
                  {recipe.description}
                </p>
              )} */}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-white">
              {recipe.prep_time_minutes !== undefined &&
                recipe.prep_time_minutes > 0 && (
                  <div className="text-center">
                    <Clock className="mx-auto mb-2" size={24} />
                    <div className="text-2xl font-bold">
                      {recipe.prep_time_minutes}m
                    </div>
                    <div className="text-sm opacity-90">Prep Time</div>
                  </div>
                )}
              {recipe.cook_time_minutes !== undefined &&
                recipe.cook_time_minutes > 0 && (
                  <div className="text-center">
                    <ChefHat className="mx-auto mb-2" size={24} />
                    <div className="text-2xl font-bold">
                      {recipe.cook_time_minutes}m
                    </div>
                    <div className="text-sm opacity-90">Cook Time</div>
                  </div>
                )}
              {recipe.servings && (
                <div className="text-center">
                  <Users className="mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold">{recipe.servings}</div>
                  <div className="text-sm opacity-90">Servings</div>
                </div>
              )}
              {recipe.rating !== undefined && recipe.rating > 0 && (
                <div className="text-center">
                  <Star className="mx-auto mb-2 fill-white" size={24} />
                  <div className="text-2xl font-bold">
                    {recipe.rating.toFixed(1)}
                  </div>
                  <div className="text-sm opacity-90">Rating</div>
                </div>
              )}
              {recipe.likes !== undefined && (
                <div className="text-center">
                  <Heart className="mx-auto mb-2 fill-white" size={24} />
                  <div className="text-2xl font-bold">{recipe.likes}</div>
                  <div className="text-sm opacity-90">Likes</div>
                </div>
              )}
              {recipe.views !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{recipe.views}</div>
                  <div className="text-sm opacity-90">Views</div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-3">
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium shadow-md hover:shadow-lg"
                >
                  <Youtube size={18} />
                  Watch Video
                </a>
              )}
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium">
                <Printer size={18} />
                Print Recipe
              </button>
              <button
                onClick={() => (isSpeaking ? stop() : speak(instructions))}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium"
              >
                <Volume2 size={18} />
                {isSpeaking ? "Stop" : "Read Aloud"}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium">
                <MessageCircle size={18} />
                Comments
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 pt-8">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("instructions")}
                className={`pb-4 px-2 font-semibold transition-all ${
                  activeTab === "instructions"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Instructions ({instructions.length})
              </button>
              <button
                onClick={() => setActiveTab("ingredients")}
                className={`pb-4 px-2 font-semibold transition-all ${
                  activeTab === "ingredients"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Ingredients ({ingredients.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {activeTab === "instructions" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Cooking Instructions
                  </h2>
                  <span className="text-sm text-gray-500">
                    {completedSteps.size} of {instructions.length} completed
                  </span>
                </div>

                {instructions.length > 0 ? (
                  instructions
                    .sort((a, b) => a.step - b.step)
                    .map((instruction, index) => (
                      <div
                        key={index}
                        className={`flex gap-4 p-5 rounded-2xl border-2 transition-all ${
                          completedSteps.has(index)
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <button
                          onClick={() => toggleStep(index)}
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold ${
                            completedSteps.has(index)
                              ? "bg-green-500 text-white"
                              : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                          }`}
                        >
                          {completedSteps.has(index) ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            instruction.step
                          )}
                        </button>
                        <div
                          className={`flex-1 leading-relaxed ${
                            completedSteps.has(index)
                              ? "text-gray-600 line-through"
                              : "text-gray-800"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(instruction.description),
                          }}
                        />
                      </div>
                    ))
                ) : (
                  <p className="text-gray-600 italic">
                    No instructions available for this recipe.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Ingredients
                </h2>
                {ingredients.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {ingredients
                      .sort((a, b) => a.order - b.order)
                      .map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {ingredient.order}
                          </div>
                          <span className="text-gray-800 flex-1">
                            {ingredient.item}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">
                    Ingredient list not available for this recipe.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-12 max-w-7xl">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-7 h-7 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-800">
              Comments
              <span className="ml-2 text-lg font-normal text-gray-500">
                ({comments.length})
              </span>
            </h2>
          </div>

          {/* Add comment */}
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 mb-8 shadow-sm border border-orange-100">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none transition-all"
                  rows={3}
                />

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    {commentText.length > 0 &&
                      `${commentText.length} characters`}
                  </p>
                  <button
                    onClick={addComment}
                    disabled={commentLoading || !commentText.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {commentLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comment list */}
          <div className="space-y-4">
            {comments.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No comments yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Be the first to share your thoughts!
                </p>
              </div>
            )}

            {comments.map((comment, index) => (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:border-orange-200"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.users?.avatar_url ? (
                      <img
                        src={comment.users.avatar_url}
                        alt={comment.users?.username || "User"}
                        className="w-10 h-10 rounded-full ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {comment.users?.username || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <span>•</span>
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <style jsx>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>

        {/* Related Recipes */}
        <RelatedRecipes recipes={related} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
