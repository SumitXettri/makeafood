"use client";
import { useEffect, useState } from "react";
import {
  ChefHat,
  Plus,
  History,
  AlertCircle,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// --- TYPES ---
interface SessionHistory {
  id: string;
  created_at: string;
  ingredients: string[];
  recipe: {
    title: string;
    difficulty?: string;
    prep_time?: string;
  };
}

interface HistorySidebarProps {
  handleNewRecipe: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
  onSelectSession?: (session: SessionHistory) => void;
  onRefresh?: (refreshFn: () => void) => void; // ← add this
}

function HistorySidebar({
  handleNewRecipe,
  isOpen,
  toggleSidebar,
  sidebarWidth,
  onSelectSession,
  onRefresh,
}: HistorySidebarProps) {
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("recipe_sessions")
        .select("id, created_at, ingredients, recipe")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      setHistory(data || []);
    } catch (err) {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // ✅ Register the refresh function with parent
    onRefresh?.(fetchHistory);
  }, []);

  // Refresh history after new recipe is generated
  const refreshHistory = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("recipe_sessions")
      .select("id, created_at, ingredients, recipe")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setHistory(data || []);
  };

  const handleNew = async () => {
    handleNewRecipe();
    await refreshHistory();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  const difficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:relative z-30 h-full bg-white border-r-2 border-orange-100 flex flex-col shadow-2xl transition-all duration-300 ease-in-out`}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="p-6 border-b border-orange-300 bg-gradient-to-br from-orange-600 via-red-500 to-red-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
              <ChefHat className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                MakeAFood
              </h2>
              <p className="text-white/80 text-xs font-medium">
                Smart Recipe Generator
              </p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* New Recipe Button */}
      <div className="p-4 border-b border-orange-100 flex-shrink-0">
        <button
          onClick={handleNew}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-xl hover:scale-[1.01] transition-all text-base font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={3} />
          New Recipe Session
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 text-md">
          <History size={20} className="text-orange-500" />
          Recent Recipes
        </h3>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 size={28} className="text-orange-400 animate-spin" />
            <p className="text-gray-400 text-xs font-medium">
              Loading history...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-6">
            <AlertCircle className="mx-auto text-red-300 mb-2" size={28} />
            <p className="text-red-400 text-xs font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && history.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto text-orange-300 mb-2" size={28} />
            <p className="text-gray-500 text-xs font-medium">
              No recipes generated yet.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Your history will appear here.
            </p>
          </div>
        )}

        {/* History Items */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-2">
            {history.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession?.(session)}
                className="group p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all cursor-pointer border border-orange-200 hover:border-orange-400 shadow-sm"
              >
                {/* Recipe Title */}
                <p className="text-gray-800 font-bold text-xs line-clamp-1 group-hover:text-orange-600 transition-colors mb-1">
                  {session.recipe?.title || "Untitled Recipe"}
                </p>

                {/* Ingredients preview */}
                <p className="text-gray-400 text-xs line-clamp-1 mb-2">
                  {session.ingredients?.slice(0, 3).join(", ")}
                  {session.ingredients?.length > 3 ? "..." : ""}
                </p>

                {/* Meta row */}
                <div className="flex items-center justify-between">
                  {session.recipe?.difficulty && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor(session.recipe.difficulty)}`}
                    >
                      {session.recipe.difficulty}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-gray-400 ml-auto">
                    <Clock size={10} />
                    <span className="text-xs">
                      {formatDate(session.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorySidebar;
