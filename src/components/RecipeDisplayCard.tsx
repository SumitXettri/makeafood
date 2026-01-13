import {
  Bookmark,
  BookOpen,
  Clock,
  Mic,
  MicOff,
  Settings,
  Users,
  Utensils,
  Youtube,
} from "lucide-react";
import React, { useState } from "react";
import VoiceSettings from "./VoiceSettings";
// --- TYPE DEFINITIONS ---

interface Recipe {
  title: string;
  ingredients: string[]; // Mock uses string array for simplicity
  instructions: string[];
  prep_time?: string;
  servings?: string;
  difficulty?: string;
  youtube_link?: string;
}

interface RecipeDisplayCardProps {
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
}
function RecipeDisplayCard({
  recipe,
  isSpeaking,
  handleSpeak,
  handleStop,
  rate,
  setRate,
  pitch,
  setPitch,
  volume,
  setVolume,
}: RecipeDisplayCardProps) {
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-orange-100 transform hover:scale-[1.005] transition-transform duration-300">
        <div className="bg-gradient-to-br from-orange-600 via-red-500 to-red-600 text-white p-6">
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">
            {recipe.title}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/90 mt-3">
            {recipe.prep_time && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-white/80" />
                Prep Time: {recipe.prep_time}
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-white/80" />
                Serves: {recipe.servings}
              </div>
            )}
            {recipe.difficulty && (
              <div className="text-white/90 font-medium italic">
                (Difficulty: {recipe.difficulty})
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t-2 border-orange-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            {recipe.youtube_link && (
              <a
                href={recipe.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                <Youtube size={18} />
                Watch Video
              </a>
            )}
            <button className="px-4 py-2 bg-white hover:bg-orange-50 border-2 border-orange-300 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-orange-600 shadow-sm hover:shadow-md hover:scale-[1.02]">
              <Bookmark size={18} />
              Save Recipe
            </button>
          </div>

          <div className="flex gap-2">
            {isSpeaking ? (
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all font-bold text-sm shadow-lg flex items-center gap-2"
              >
                <MicOff size={18} />
                Stop Reading
              </button>
            ) : (
              <button
                onClick={handleSpeak}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg flex items-center gap-2"
              >
                <Mic size={18} />
                Read Recipe
              </button>
            )}

            <button
              onClick={() => setShowVoiceSettings((prev) => !prev)}
              className="p-2.5 text-gray-600 hover:text-orange-600 bg-white hover:bg-orange-100 rounded-xl transition-all border-2 border-orange-200 shadow-sm"
              title="Voice Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <VoiceSettings
          rate={rate}
          setRate={setRate}
          pitch={pitch}
          setPitch={setPitch}
          volume={volume}
          setVolume={setVolume}
          showVoiceSettings={showVoiceSettings}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6">
        <h3 className="text-xl font-extrabold mb-4 flex items-center gap-3 text-gray-800 border-b pb-3 border-orange-100">
          <Utensils className="text-orange-500" size={24} />
          Ingredients
        </h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {recipe?.ingredients?.map((ing: string, i: number) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-orange-50/70 rounded-lg border border-orange-200 hover:bg-orange-100 transition-all"
            >
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2.5 shadow-md"></div>
              <span className="text-gray-800 font-medium text-sm">{ing}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6">
        <h3 className="text-xl font-extrabold mb-4 flex items-center gap-3 text-gray-800 border-b pb-3 border-orange-100">
          <BookOpen className="text-orange-500" size={24} />
          Preparation Instructions
        </h3>
        <ol className="space-y-4">
          {recipe?.instructions?.map((step: string, i: number) => (
            <li key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-black shadow-md mt-0.5">
                {i + 1}
              </div>
              <span className="text-gray-800 flex-1 text-base font-normal leading-relaxed pt-0.5">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default RecipeDisplayCard;
