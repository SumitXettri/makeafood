"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Shield,
  Users,
  ChefHat,
  Check,
  X,
  Ban,
  Search,
  Eye,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DatabaseUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

interface RecipeUser {
  email: string;
  username: string;
}

interface Recipe {
  id: string;
  title: string;
  image_url?: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty_level: string;
  ingredients: string[];
  instructions: string[];
  is_approved: boolean;
  created_at: string;
  cuisine: string;
  users: RecipeUser;
}

export default function AdminPanel() {
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(
    null
  );
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  useEffect(() => {
    console.log("🚀 Admin Panel Component Mounted");
    console.log("Initial check for logged in user...");
    checkUser();
  }, []);

  useEffect(() => {
    console.log("\n🔄 useEffect triggered - activeTab or statusFilter changed");
    console.log("User logged in:", !!user);
    console.log("Active tab:", activeTab);
    console.log("Status filter:", statusFilter);

    if (user) {
      if (activeTab === "recipes") {
        console.log("→ Fetching recipes...");
        fetchRecipes();
      }
      if (activeTab === "users") {
        console.log("→ Fetching users...");
        fetchUsers();
      }
    } else {
      console.log("⚠️ No user logged in, skipping fetch");
    }
  }, [user, activeTab, statusFilter]);

  // Real-time subscription
  useEffect(() => {
    if (!user || activeTab !== "recipes") {
      console.log("Real-time subscription not active (no user or wrong tab)");
      return;
    }

    console.log("🔴 Setting up real-time subscription for recipe changes...");

    const channel = supabase
      .channel("recipe-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
        },
        (payload) => {
          console.log("\n🔥 REAL-TIME UPDATE DETECTED!");
          console.log("Event type:", payload.eventType);
          console.log("Payload:", payload);
          console.log("New recipe data:", payload.new);
          console.log("Old recipe data:", payload.old);
          console.log("→ Refetching recipes...");
          fetchRecipes();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("🔴 Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [user, activeTab, statusFilter]);

  // Log filtered recipes
  useEffect(() => {
    console.log("\n🔍 Filtering recipes");
    console.log("Total recipes:", recipes.length);
    console.log("Search term:", searchTerm);
    const filtered = recipes.filter(
      (r) =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.users?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("Filtered results:", filtered.length);
  }, [recipes, searchTerm]);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const isAdmin = await checkAdminStatus(user.id);
        if (isAdmin) {
          setUser(user);
        } else {
          setError("Access denied. Admin privileges required.");
          await supabase.auth.signOut();
        }
      }
    } catch (err: unknown) {
      console.error("Error checking user:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (error) return false;
      const adminEmails = ["admin01@gmail.com", "admin02@gmail.com"];
      return adminEmails.includes(data?.email);
    } catch (err) {
      console.error("Error in checkAdminStatus:", err);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const isAdmin = await checkAdminStatus(data.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      setUser(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const fetchRecipes = async () => {
    console.log("\n=== FETCH RECIPES START ===");
    console.log("Current statusFilter:", statusFilter);
    console.log("Current activeTab:", activeTab);
    console.log("Current user:", user?.email);

    try {
      setFetchingRecipes(true);

      let query = supabase
        .from("recipes")
        .select(
          `
          *,
          users:user_id (email, username)
        `
        )
        .order("created_at", { ascending: false });

      if (statusFilter === "pending") {
        console.log("Filtering for PENDING recipes (is_approved = false)");
        query = query.eq("is_approved", false);
      } else if (statusFilter === "approved") {
        console.log("Filtering for APPROVED recipes (is_approved = true)");
        query = query.eq("is_approved", true);
      } else {
        console.log("Fetching ALL recipes (no filter)");
      }

      console.log("Executing Supabase query...");
      const { data, error } = await query;

      if (error) {
        console.error("❌ Supabase query error:", error);
        throw error;
      }

      console.log("✅ Query successful!");
      console.log("Total recipes fetched:", data?.length || 0);
      console.log("Raw data from Supabase:", data);

      if (data && data.length > 0) {
        console.log("First recipe sample:", data[0]);
        console.log(
          "Recipe approval statuses:",
          data.map((r) => ({
            id: r.id,
            title: r.title,
            is_approved: r.is_approved,
          }))
        );

        const approvedCount = data.filter((r) => r.is_approved).length;
        const pendingCount = data.filter((r) => !r.is_approved).length;
        console.log(
          `Breakdown: ${approvedCount} approved, ${pendingCount} pending`
        );
      } else {
        console.warn("⚠️ No recipes returned from query");
      }

      setRecipes(data || []);
      console.log("State updated with recipes");
    } catch (err: unknown) {
      console.error("❌ Error in fetchRecipes:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        error: err,
      });
    } finally {
      setFetchingRecipes(false);
      console.log("=== FETCH RECIPES END ===\n");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
    }
  };

  const approveRecipe = async (recipeId: string, approved: boolean) => {
    console.log("\n=== APPROVE RECIPE START ===");
    console.log("Recipe ID:", recipeId);
    console.log("Setting approved to:", approved);
    console.log("Setting is_public to:", approved);

    try {
      console.log("Optimistically updating local state...");
      setRecipes((prevRecipes) => {
        const updated = prevRecipes.map((recipe) =>
          recipe.id === recipeId ? { ...recipe, is_approved: approved } : recipe
        );
        console.log("Updated recipes count:", updated.length);
        return updated;
      });

      console.log("Sending update to Supabase...");
      const { data, error } = await supabase
        .from("recipes")
        .update({
          is_approved: approved,
          is_public: approved,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recipeId)
        .select();

      if (error) {
        console.error("❌ Supabase update error:", error);
        throw error;
      }

      console.log("✅ Supabase update successful!");
      console.log("Updated recipe data:", data);

      console.log("Refetching all recipes...");
      await fetchRecipes();

      setSelectedRecipe(null);
      console.log("Modal closed");
      console.log("=== APPROVE RECIPE END ===\n");
    } catch (err: unknown) {
      console.error("❌ Error approving recipe:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        error: err,
      });
      alert("Failed to update recipe status");

      console.log("Reverting optimistic update...");
      await fetchRecipes();
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) {
      console.log("Delete cancelled by user");
      return;
    }

    console.log("\n=== DELETE RECIPE START ===");
    console.log("Recipe ID to delete:", recipeId);

    try {
      console.log("Optimistically removing from local state...");
      setRecipes((prevRecipes) => {
        const filtered = prevRecipes.filter((recipe) => recipe.id !== recipeId);
        console.log("Recipes remaining after delete:", filtered.length);
        return filtered;
      });

      console.log("Sending delete request to Supabase...");
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) {
        console.error("❌ Supabase delete error:", error);
        throw error;
      }

      console.log("✅ Recipe deleted successfully from database");
      setSelectedRecipe(null);
      console.log("=== DELETE RECIPE END ===\n");
    } catch (err: unknown) {
      console.error("❌ Error deleting recipe:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        error: err,
      });
      alert("Failed to delete recipe");

      console.log("Refetching recipes after delete error...");
      await fetchRecipes();
    }
  };

  const filteredRecipes = recipes.filter(
    (r) =>
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.users?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            Admin Panel
          </h1>
          <p className="text-center text-gray-600 mb-6">
            MakeAFood Administration
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                placeholder="Enter admin password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {fetchingRecipes && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 mt-2">Refreshing recipes...</p>
        </div>
      )}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              MakeAFood Admin
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={openLogoutModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "recipes"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ChefHat className="w-5 h-5" />
            <span>Recipes</span>
            {recipes.filter((r) => !r.is_approved).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {recipes.filter((r) => !r.is_approved).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "users"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === "recipes" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === "pending"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter("approved")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === "approved"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Check className="w-4 h-4 inline mr-2" />
                    Approved
                  </button>
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === "all"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                </div>

                {/* ✅ ADD THIS REFRESH BUTTON */}
                <button
                  onClick={fetchRecipes}
                  disabled={fetchingRecipes}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium disabled:opacity-50"
                >
                  <svg
                    className={`w-5 h-5 inline mr-2 ${
                      fetchingRecipes ? "animate-spin" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Recipe Management
                </h2>
                {filteredRecipes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No recipes found
                  </p>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {recipe.image_url && (
                              <img
                                src={recipe.image_url}
                                alt={recipe.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">
                                {recipe.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                By:{" "}
                                {recipe.users?.username ||
                                  recipe.users?.email ||
                                  "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  recipe.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {recipe.is_approved ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                ✓ Approved
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                ⏳ Pending
                              </span>
                            )}
                            {recipe.cuisine && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {recipe.cuisine}
                              </span>
                            )}
                            {recipe.difficulty_level && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                {recipe.difficulty_level}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRecipe(recipe)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {!recipe.is_approved ? (
                            <button
                              onClick={() => approveRecipe(recipe.id, true)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => approveRecipe(recipe.id, false)}
                              className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                              title="Unapprove"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRecipe(recipe.id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            title="Delete"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "users" && (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  User Management
                </h2>
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No users found
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {u.avatar_url && (
                            <img
                              src={u.avatar_url}
                              alt={u.username}
                              className="w-12 h-12 object-cover rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {u.username || "No username"}
                            </h3>
                            <p className="text-sm text-gray-600">{u.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Joined:{" "}
                              {new Date(u.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedRecipe.title}
                </h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedRecipe.image_url && (
                <img
                  src={selectedRecipe.image_url}
                  alt={selectedRecipe.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-4">
                {selectedRecipe.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600">
                      {selectedRecipe.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedRecipe.prep_time_minutes && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Prep Time</h4>
                      <p className="text-gray-600">
                        {selectedRecipe.prep_time_minutes} min
                      </p>
                    </div>
                  )}
                  {selectedRecipe.cook_time_minutes && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Cook Time</h4>
                      <p className="text-gray-600">
                        {selectedRecipe.cook_time_minutes} min
                      </p>
                    </div>
                  )}
                  {selectedRecipe.servings && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Servings</h4>
                      <p className="text-gray-600">{selectedRecipe.servings}</p>
                    </div>
                  )}
                  {selectedRecipe.difficulty_level && (
                    <div>
                      <h4 className="font-semibold text-gray-700">
                        Difficulty
                      </h4>
                      <p className="text-gray-600">
                        {selectedRecipe.difficulty_level}
                      </p>
                    </div>
                  )}
                </div>

                {selectedRecipe.ingredients && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Ingredients
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-gray-600">
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRecipe.instructions && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Instructions
                    </h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {selectedRecipe.instructions.map((inst, i) => (
                        <li key={i} className="text-gray-600">
                          {inst}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  {!selectedRecipe.is_approved ? (
                    <button
                      onClick={() => approveRecipe(selectedRecipe.id, true)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      <Check className="w-5 h-5 inline mr-2" />
                      Approve Recipe
                    </button>
                  ) : (
                    <button
                      onClick={() => approveRecipe(selectedRecipe.id, false)}
                      className="flex-1 bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition font-semibold"
                    >
                      Unapprove Recipe
                    </button>
                  )}
                  <button
                    onClick={() => deleteRecipe(selectedRecipe.id)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    <Ban className="w-5 h-5 inline mr-2" />
                    Delete Recipe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoggingOut) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Confirm Logout
                  </h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to log out?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              You will be signed out of your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
