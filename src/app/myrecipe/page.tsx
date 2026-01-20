"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Eye, Calendar, ChefHat, Lock } from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface Recipe {
  id: number;
  title: string;
  image_url?: string;
  likes?: number;
  views?: number;
  created_at?: string;
}

export default function MyRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchMyRecipes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRecipes([]);
        setLoading(false);
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from("recipes")
        .select("id, title, image_url, likes, views, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch user recipes:", error);
        setRecipes([]);
      } else {
        setRecipes(data || []);
      }
      setLoading(false);
    };

    fetchMyRecipes();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="text-orange-500" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Login Required
            </h1>
            <p className="text-gray-600 mb-8">
              Please log in to view and manage your recipes.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Log In / Sign Up
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ChefHat className="text-orange-500" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            No Recipes Yet
          </h1>
          <p className="text-gray-600 mb-8">
            Start your culinary journey by adding your first recipe!
          </p>
          <Link
            href="/addrecipe"
            className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Add Your First Recipe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Recipes</h1>
          <p className="text-gray-600">
            You have {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <Link
              key={r.id}
              href={`/recipe/${r.id}`}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02]"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={r.image_url || "/placeholder-recipe.jpg"}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-800 line-clamp-2 mb-3 group-hover:text-orange-600 transition-colors">
                  {r.title}
                </h3>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Heart size={16} className="text-red-400" />
                    <span>{r.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={16} className="text-blue-400" />
                    <span>{r.views || 0}</span>
                  </div>
                </div>

                {r.created_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                    <Calendar size={14} />
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}