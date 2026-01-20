"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Bookmark, Lock, Trash2 } from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface SavedRecipe {
  id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_image: string | null;
  created_at: string;
}

export default function SavedRecipesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUser(user);

    const { data, error } = await supabase
      .from("saved_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSaved(data);
    }

    setLoading(false);
  };

  const handleRemove = async (savedId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setRemovingId(savedId);

    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("id", savedId);

    if (!error) {
      setSaved(saved.filter((r) => r.id !== savedId));
    }

    setRemovingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
        </Suspense>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading saved recipes...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
        </Suspense>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="text-orange-500" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Login Required
            </h1>
            <p className="text-gray-600 mb-8">
              Please log in to view your saved recipes.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="text-orange-500" size={32} />
            <h1 className="text-4xl font-bold text-gray-800">Saved Recipes</h1>
          </div>
          <p className="text-gray-600">
            {saved.length === 0 
              ? "No saved recipes yet" 
              : `${saved.length} ${saved.length === 1 ? "recipe" : "recipes"} saved`}
          </p>
        </div>

        {saved.length === 0 ? (
          <div className="text-center max-w-md mx-auto mt-16">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Bookmark className="text-orange-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              No Saved Recipes Yet
            </h2>
            <p className="text-gray-600 mb-8">
              Start exploring and bookmark your favorite recipes to see them here!
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Explore Recipes
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {saved.map((r) => (
              <Link
                key={r.id}
                href={`/recipe/${r.recipe_id}`}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02]"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={r.recipe_image || "/logo.svg"}
                    alt={r.recipe_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(r.id, e)}
                    disabled={removingId === r.id}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 text-gray-700 hover:text-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    aria-label="Remove from saved"
                  >
                    {removingId === r.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>

                  {/* Bookmark badge */}
                  <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Bookmark size={12} fill="currentColor" />
                    Saved
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                    {r.recipe_title}
                  </h3>
                  
                  <p className="text-xs text-gray-400">
                    Saved on {formatDate(r.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}