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
} from "lucide-react";

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

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === "recipes") fetchRecipes();
      if (activeTab === "users") fetchUsers();
    }
  }, [user, activeTab, statusFilter]);

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
      // Check if user email is in admin list (you can customize this)
      const adminEmails = ["admin01@gmail.com", "admin02@gmail.com"]; // Add your admin emails
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
    await supabase.auth.signOut();
    setUser(null);
  };

  const fetchRecipes = async () => {
    try {
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
        query = query.eq("is_approved", false);
      } else if (statusFilter === "approved") {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecipes(data || []);
    } catch (err: unknown) {
      console.error("Error fetching recipes:", err);
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
    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          is_approved: approved,
          is_public: approved,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recipeId);

      if (error) throw error;
      fetchRecipes();
      setSelectedRecipe(null);
    } catch (err: unknown) {
      console.error("Error approving recipe:", err);
      alert("Failed to update recipe status");
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;
      fetchRecipes();
      setSelectedRecipe(null);
    } catch (err: unknown) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe");
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
              onClick={handleLogout}
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
    </div>
  );
}
