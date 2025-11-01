"use client";
import { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  Bookmark,
  Star,
  Printer,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Volume2,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Recipe {
  id: string;
  title: string;
  image: string;
  category: string;
  area: string;
  instructions: string;
  source: string;
  description: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  rating?: number;
  views?: number;
  ingredients?: string[];
  tags?: string[];
  youtube_link?: string;
}

interface RelatedRecipe {
  id: string;
  title: string;
  image: string;
  difficulty_level?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  youtube_link?: string;
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
                <Image
                  width={120}
                  height={120}
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
                {recipe.youtube_link && (
                  <a
                    href={recipe.youtube_link}
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
                onClick={() => {
                  const fixedId = recipe.id.startsWith("spoonacular-")
                    ? `s-${recipe.id.replace("spoonacular-", "")}`
                    : recipe.id.startsWith("mealdb-")
                    ? `m-${recipe.id.replace("mealdb-", "")}`
                    : recipe.id;

                  router.push(`/recipe/${fixedId}`);
                }}
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">(
    "instructions"
  );
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(
    null
  );
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSegmentIndex(null);
    setCurrentWordIndex(null);
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech not supported. Try Chrome or Edge.");
      return;
    }

    window.speechSynthesis.cancel();

    if (!recipe?.instructions) {
      alert("No instructions available to read.");
      return;
    }

    const textToRead = instructions
      .map((step, index) => `Step ${index + 1}: ${step}`)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSegmentIndex(null);
      setCurrentWordIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

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

        console.log("API Response:", data);

        if (data.error) throw new Error(data.error);

        setRecipe(data.recipe);

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
            href="/search"
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

  const instructions = recipe.instructions
    .split("\n")
    .filter((step) => step.trim());

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
            <Image
              width={120}
              height={120}
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            {/* YouTube button on hero image - bottom right */}
            {recipe.youtube_link && (
              <a
                href={recipe.youtube_link}
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
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-12 h-12 ${
                  isFavorite ? "bg-red-500" : "bg-white/90 backdrop-blur-sm"
                } rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg`}
              >
                <Heart
                  className={
                    isFavorite ? "text-white fill-white" : "text-red-500"
                  }
                  size={22}
                />
              </button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`w-12 h-12 ${
                  isSaved ? "bg-orange-500" : "bg-white/90 backdrop-blur-sm"
                } rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg`}
              >
                <Bookmark
                  className={
                    isSaved ? "text-white fill-white" : "text-orange-500"
                  }
                  size={22}
                />
              </button>
              <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg">
                <Share2 className="text-gray-700" size={22} />
              </button>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-800">
                  {recipe.category}
                </span>
                <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-800">
                  {recipe.area}
                </span>
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
              {recipe.description && (
                <p className="text-white/90 text-lg max-w-3xl drop-shadow">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-white">
              {recipe.prep_time_minutes && (
                <div className="text-center">
                  <Clock className="mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold">
                    {recipe.prep_time_minutes}
                  </div>
                  <div className="text-sm opacity-90">Prep Time</div>
                </div>
              )}
              {recipe.cook_time_minutes && (
                <div className="text-center">
                  <ChefHat className="mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold">
                    {recipe.cook_time_minutes}
                  </div>
                  <div className="text-sm opacity-90">Cook Time</div>
                </div>
              )}
              {recipe.servings && (
                <div className="text-center ">
                  <div className="flex space-x-2">
                    <Users className="mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold">
                      {recipe.servings} servings
                    </p>
                  </div>
                </div>
              )}
              {recipe.rating && (
                <div className="text-center">
                  <Star className="mx-auto mb-2 fill-white" size={24} />
                  <div className="text-2xl font-bold">{recipe.rating}</div>
                  <div className="text-sm opacity-90">Rating</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-3">
              {recipe.youtube_link && (
                <a
                  href={recipe.youtube_link}
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
                onClick={() => (isSpeaking ? stop() : speak())}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium"
              >
                <Volume2 size={18} />
                {isSpeaking ? "Stop" : "Read Aloud"}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium">
                <MessageCircle size={18} />
                Comments (12)
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
                Instructions
              </button>
              <button
                onClick={() => setActiveTab("ingredients")}
                className={`pb-4 px-2 font-semibold transition-all ${
                  activeTab === "ingredients"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Ingredients
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

                {instructions.map((step, index) => (
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
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        completedSteps.has(index)
                          ? "bg-green-500 text-white"
                          : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                      }`}
                    >
                      {completedSteps.has(index) ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </button>
                    <div
                      className={`flex-1 leading-relaxed ${
                        completedSteps.has(index)
                          ? "text-gray-600 line-through"
                          : "text-gray-800"
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(step),
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Ingredients
                </h2>
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100"
                      >
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-gray-800">{ingredient}</span>
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

        {/* Related Recipes */}
        <RelatedRecipes recipes={related} />
      </div>
    </div>
  );
}
