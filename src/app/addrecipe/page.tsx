"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FaUtensils, FaClock, FaUsers, FaListUl } from "react-icons/fa";
import { MdOutlineRestaurantMenu } from "react-icons/md";

export default function SubmitRecipePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState<number | undefined>();
  const [cookTime, setCookTime] = useState<number | undefined>();
  const [servings, setServings] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Easy"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setLoading(true);

    // Check if recipe exists
    const { data: existing, error: checkError } = await supabase
      .from("recipes")
      .select("id, title")
      .ilike("title", `%${title.trim()}%`);

    if (checkError) {
      setError(checkError.message);
      setLoading(false);
      return;
    }

    if (existing && existing.length > 0) {
      setError(
        `A recipe with a similar title already exists: "${existing[0].title}".`
      );
      setLoading(false);
      return;
    }

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("You must be logged in to submit a recipe.");
      setLoading(false);
      return;
    }

    // Insert recipe
    const { error: insertError } = await supabase.from("recipes").insert([
      {
        user_id: user.id,
        title,
        description,
        prep_time_minutes: prepTime,
        cook_time_minutes: cookTime,
        servings,
        difficulty_level: difficulty,
        is_public: true,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100 p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/food-pattern.svg')] opacity-10 bg-cover bg-center"></div>

      <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-2xl p-10 border border-orange-200">
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-orange-700 mb-2 text-center flex items-center justify-center gap-2">
          <FaUtensils /> Share Your Recipe
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Inspire food lovers by adding your delicious creation 🍲
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Recipe Title
            </label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-orange-400 bg-white shadow-sm">
              <MdOutlineRestaurantMenu className="text-orange-500 mr-2" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full outline-none bg-transparent"
                placeholder="e.g. Spicy Chicken Curry"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none shadow-sm"
              placeholder="A short description about your recipe..."
            />
          </div>

          {/* Prep & Cook Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
              <FaClock className="text-orange-500 mr-2" />
              <input
                type="number"
                placeholder="Prep (min)"
                value={prepTime || ""}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
              <FaClock className="text-red-500 mr-2" />
              <input
                type="number"
                placeholder="Cook (min)"
                value={cookTime || ""}
                onChange={(e) => setCookTime(Number(e.target.value))}
                className="w-full outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Servings */}
          <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
            <FaUsers className="text-yellow-500 mr-2" />
            <input
              type="number"
              placeholder="Servings"
              value={servings || ""}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-full outline-none bg-transparent"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Difficulty
            </label>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
              <FaListUl className="text-green-500 mr-2" />
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
                }
                className="w-full outline-none bg-transparent"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm font-medium text-center">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:scale-105 transition-transform disabled:opacity-60"
          >
            {loading ? "Submitting..." : "✨ Submit Recipe"}
          </button>
        </form>
      </div>
    </div>
  );
}
