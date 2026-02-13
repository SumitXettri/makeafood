"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { ChefHat, Check, X } from "lucide-react";

interface ChiefProfile {
  id: string;
  user_id: string;
  expertise_area: string;
  specialization: string | null;
  experience_years: number | null;
  certification: string | null;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  difficulty_level: string | null;
  is_approved: boolean;
  created_at: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  ingredients: any;
  instructions: any;
  is_public: boolean;
  users: {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
  };
}

function ChiefDashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chiefData, setChiefData] = useState<ChiefProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "all"
  >("pending");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<"review" | "myrecipes">("review");

  useEffect(() => {
    checkChiefAuth();
  }, []);

  const checkChiefAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCurrentUser(profile);
      }

      // Check if user is a chief
      const { data: chief, error } = await supabase
        .from("chiefs")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error || !chief) {
        alert("You don't have chief access!");
        window.location.href = "/dashboard";
        return;
      }

      setChiefData(chief);
      await fetchRecipesToReview(chief.expertise_area);
      await fetchMyRecipes(user.id);
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipesToReview = async (expertiseArea: string) => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select(
          `
          *,
          users:user_id (
            id,
            username,
            email,
            avatar_url
          )
        `,
        )
        .eq("cuisine", expertiseArea)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const fetchMyRecipes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select(
          `
          *,
          users:user_id (
            id,
            username,
            email,
            avatar_url
          )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyRecipes(data || []);
    } catch (error) {
      console.error("Error fetching my recipes:", error);
    }
  };

  const approveRecipe = async (recipeId: number, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          is_approved: approve,
          approved_by: approve ? currentUser?.id : null,
          approved_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", recipeId);

      if (error) throw error;

      alert(`Recipe ${approve ? "approved" : "unapproved"} successfully!`);
      setSelectedRecipe(null);
      if (chiefData) {
        fetchRecipesToReview(chiefData.expertise_area);
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      alert("Failed to update recipe status");
    }
  };

  const deleteRecipe = async (recipeId: number) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;

      alert("Recipe deleted successfully!");
      if (currentUser) {
        fetchMyRecipes(currentUser.id);
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe");
    }
  };

  const toggleVisibility = async (recipeId: number, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from("recipes")
        .update({ is_public: !isPublic })
        .eq("id", recipeId);

      if (error) throw error;

      if (currentUser) {
        fetchMyRecipes(currentUser.id);
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert("Failed to update visibility");
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.users?.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !recipe.is_approved) ||
      (statusFilter === "approved" && recipe.is_approved);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalToReview: recipes.length,
    pending: recipes.filter((r) => !r.is_approved).length,
    approved: recipes.filter((r) => r.is_approved).length,
    myTotal: myRecipes.length,
    myApproved: myRecipes.filter((r) => r.is_approved).length,
    myPending: myRecipes.filter((r) => !r.is_approved).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mb-4"></div>
          <div className="text-lg text-gray-600">
            Loading Chief Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Chief Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <ChefHat className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">Chief Panel</h1>
                <p className="text-orange-100">
                  {chiefData?.expertise_area} Cuisine Expert
                </p>
                {chiefData?.specialization && (
                  <p className="text-sm text-orange-100 mt-1">
                    Specialization: {chiefData.specialization}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm">Logged in as</p>
              <p className="font-semibold">
                {currentUser?.username || currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">✅</span>
              <p className="text-3xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-600">Approved</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👨‍🍳</span>
              <p className="text-3xl font-bold text-blue-600">
                {stats.myTotal}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-600">My Recipes</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">✔️</span>
              <p className="text-3xl font-bold text-green-600">
                {stats.myApproved}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-600">My Approved</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⏰</span>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.myPending}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-600">My Pending</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("myrecipes")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "myrecipes"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            My Recipes ({stats.myTotal})
          </button>
        </div>

        {/* My Recipes Tab */}
        {activeTab === "myrecipes" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              My Recipes
            </h2>

            {myRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  You haven't created any recipes yet
                </p>
                <a
                  href="/addrecipe"
                  className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Create Your First Recipe
                </a>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        {recipe.is_approved ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            ✅ Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {recipe.description}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <a
                          href={`/recipe/${recipe.id}`}
                          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-center hover:bg-orange-700 transition text-sm font-medium"
                        >
                          View
                        </a>
                        <button
                          onClick={() =>
                            toggleVisibility(recipe.id, recipe.is_public)
                          }
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          title={
                            recipe.is_public ? "Make Private" : "Make Public"
                          }
                        >
                          {recipe.is_public ? "🔓" : "🔒"}
                        </button>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal - Same structure as before */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900 pr-4">
                  {selectedRecipe.title}
                </h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedRecipe.image_url && (
                <img
                  src={selectedRecipe.image_url}
                  alt={selectedRecipe.title}
                  className="w-full h-72 object-cover rounded-xl mb-6 shadow-md"
                />
              )}

              {selectedRecipe.description && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600">{selectedRecipe.description}</p>
                </div>
              )}

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                {!selectedRecipe.is_approved ? (
                  <button
                    onClick={() => approveRecipe(selectedRecipe.id, true)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold"
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    Approve Recipe
                  </button>
                ) : (
                  <button
                    onClick={() => approveRecipe(selectedRecipe.id, false)}
                    className="flex-1 bg-yellow-600 text-white py-3 rounded-xl hover:bg-yellow-700 transition font-semibold"
                  >
                    Unapprove Recipe
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChiefDashboard;
