"use client";
import { useEffect, useState } from "react";
import {

  Plus,
  Clock,
  Loader2,
  AlertCircle,
  X,
  UtensilsCrossed,
  Home,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

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
  onRefresh?: (refreshFn: () => void) => void;
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
  const [activeId, setActiveId] = useState<string | null>(null);

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
    } catch {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    onRefresh?.(fetchHistory);
  }, []);

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
    setActiveId(null);
    handleNewRecipe();
    await refreshHistory();
  };

  const handleSelect = (session: SessionHistory) => {
    setActiveId(session.id);
    onSelectSession?.(session);
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

  const difficultyStyle = (d?: string) => {
    switch (d?.toLowerCase()) {
      case "easy":
        return "text-emerald-600 bg-emerald-50";
      case "medium":
        return "text-amber-600 bg-amber-50";
      case "hard":
        return "text-red-500 bg-red-50";
      default:
        return "text-gray-400 bg-gray-50";
    }
  };

  // Group history by date label
  const groupByDate = (items: SessionHistory[]) => {
    const groups: Record<string, SessionHistory[]> = {};
    items.forEach((s) => {
      const label = formatDateGroup(s.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return groups;
  };

  const formatDateGroup = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "This week";
    return "Older";
  };

  const grouped = groupByDate(history);
  const groupOrder = ["Today", "Yesterday", "This week", "Older"];

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:relative z-30 h-full flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-gray-100`}
      style={{
        width: `${sidebarWidth}px`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0 ">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl  flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={60}
              height={60}
              className="text-orange-400  transition-colors"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-black leading-none group-hover:text-orange-300 transition-colors">
              MakeAFood
            </p>
            <p className="text-[11px] text-black/40 mt-0.5 flex items-center gap-1">
              <Home size={9} className="text-black/30" />
              Back to home
            </p>
          </div>
        </Link>

        <button
          onClick={toggleSidebar}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* New Recipe button */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          onClick={handleNew}
          className="w-full flex cursor-pointer items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Recipe
        </button>
      </div>

      {/* History label */}
      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          History
        </p>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 size={20} className="text-orange-300 animate-spin" />
            <p className="text-xs text-gray-400">Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center py-10 gap-1.5">
            <AlertCircle size={20} className="text-red-300" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-2 text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              No recipes yet. Generate your first one below!
            </p>
          </div>
        )}

        {/* Grouped history */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {groupOrder.map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;
              return (
                <div key={group}>
                  {/* Group label */}
                  <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider px-2 mb-1">
                    {group}
                  </p>

                  <div className="space-y-0.5 cursor-pointer">
                    {items.map((session) => {
                      const isActive = activeId === session.id;
                      return (
                        <button
                          key={session.id}
                          onClick={() => handleSelect(session)}
                          className={`w-full text-left cursor-pointer px-3 py-2.5 rounded-xl transition-all group ${
                            isActive
                              ? "bg-orange-50 border border-orange-100"
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          {/* Title */}
                          <p
                            className={`text-xs font-medium line-clamp-1 mb-1 transition-colors ${
                              isActive
                                ? "text-orange-600"
                                : "text-gray-700 group-hover:text-gray-900"
                            }`}
                          >
                            {session.recipe?.title || "Untitled Recipe"}
                          </p>

                          {/* Ingredients preview */}
                          <p className="text-[11px] text-gray-400 line-clamp-1 mb-1.5">
                            {session.ingredients?.slice(0, 3).join(", ")}
                            {session.ingredients?.length > 3 ? "…" : ""}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center justify-between">
                            {session.recipe?.difficulty ? (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${difficultyStyle(session.recipe.difficulty)}`}
                              >
                                {session.recipe.difficulty}
                              </span>
                            ) : (
                              <span />
                            )}
                            <div className="flex items-center gap-1 text-gray-300">
                              <Clock size={9} />
                              <span className="text-[10px]">
                                {formatDate(session.created_at)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorySidebar;
