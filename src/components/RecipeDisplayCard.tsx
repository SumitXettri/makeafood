import {
  BookOpen,
  ChefHat,
  Clock,
  Mic,
  MicOff,
  Users,
  Utensils,
  X,
} from "lucide-react";
import React, { useState } from "react";

// --- TYPE DEFINITIONS ---
interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: string;
  servings?: string;
  difficulty?: string;
  youtube_link?: string;
}

interface RecipePanelProps {
  recipe: Recipe;
  isSpeaking: boolean;
  handleSpeak: () => void;
  handleStop: () => void;
  rate: number;
  setRate: (r: number) => void;
  pitch: number;
  setPitch: (p: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  onClose: () => void;
}

function RecipePanel({
  recipe,
  isSpeaking,
  handleSpeak,
  handleStop,
  onClose,
}: RecipePanelProps) {
  const [activeTab, setActiveTab] = useState<"ingredients" | "steps">(
    "ingredients",
  );

  const difficultyStyle = (d?: string) => {
    switch (d?.toLowerCase()) {
      case "easy":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "hard":
        return "text-red-500 bg-red-50 border-red-100";
      default:
        return "text-gray-500 bg-gray-50 border-gray-100";
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Panel header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ChefHat size={18} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight">
              {recipe.title}
            </h2>
            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {recipe.prep_time && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                  <Clock size={10} className="text-gray-400" />
                  {recipe.prep_time}
                </span>
              )}
              {recipe.servings && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                  <Users size={10} className="text-gray-400" />
                  {recipe.servings} servings
                </span>
              )}
              {recipe.difficulty && (
                <span
                  className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle(recipe.difficulty)}`}
                >
                  {recipe.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Read aloud toggle */}
          <button
            onClick={isSpeaking ? handleStop : handleSpeak}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSpeaking
                ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-500"
            }`}
          >
            {isSpeaking ? <MicOff size={13} /> : <Mic size={13} />}
            {isSpeaking ? "Stop" : "Read"}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
        <button
          onClick={() => setActiveTab("ingredients")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "ingredients"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Utensils size={12} />
          Ingredients
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === "ingredients"
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {recipe.ingredients.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("steps")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "steps"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <BookOpen size={12} />
          Steps
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === "steps"
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {recipe.instructions.length}
          </span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Ingredients tab */}
        {activeTab === "ingredients" && (
          <div className="space-y-1.5">
            {recipe.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-300 flex-shrink-0 group-hover:bg-orange-400 transition-colors" />
                <span className="text-sm text-gray-700">{ing}</span>
              </div>
            ))}
          </div>
        )}

        {/* Steps tab */}
        {activeTab === "steps" && (
          <ol className="space-y-5">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold">
                    {i + 1}
                  </div>
                  {i < recipe.instructions.length - 1 && (
                    <div className="w-px flex-1 bg-gray-100 mt-2 mb-0 min-h-[20px]" />
                  )}
                </div>
                <div className="pt-0.5 pb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {step}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Footer — optional YouTube link */}
      {recipe.youtube_link && (
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <a
            href={recipe.youtube_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

export default RecipePanel;
