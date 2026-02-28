"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import {
  ChefHat,
  Check,
  X,
  Eye,
  Clock,
  Search,
  AlertCircle,
  Ban,
} from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  cuisine?: string;
  difficulty_level?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  is_approved: boolean;
  user_id: string;
  users?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
  ingredients?: Array<string | RecipeItem>;
  instructions?: Array<string | RecipeItem>;
}

interface RecipeItem {
  order?: number;
  item: string;
}

interface Chief {
  id: string;
  user_id: string;
  expertise_area: string;
  specialization?: string;
  experience_years?: number;
  certification?: string;
  is_active: boolean;
}

export default function ChiefPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [chiefData, setChiefData] = useState<Chief | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/"; // Redirect to login
          return;
        }

        setUser(user);

        // Check if user is a chief
        const { data: chief, error } = await supabase
          .from("chiefs")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (error || !chief) {
          alert("You don't have chief access!");
          window.location.href = "/"; // Redirect to home
          return;
        }

        setChiefData(chief);
        fetchRecipes(chief.expertise_area);
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchRecipes = async (expertiseArea: string) => {
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
      setRecipes((data as Recipe[]) || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const approveRecipe = async (recipeId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          is_approved: approve,
          approved_by: approve ? user?.id : null,
          approved_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", recipeId);

      if (error) throw error;

      setNotificationMessage(
        `Recipe ${approve ? "approved" : "deapproved"} successfully!`,
      );
      setNotificationType("success");
      setShowNotification(true);
      setSelectedRecipe(null);
      if (chiefData) {
        fetchRecipes(chiefData.expertise_area);
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      setNotificationMessage("Failed to update recipe status");
      setNotificationType("error");
      setShowNotification(true);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    setRecipeToDelete(recipeId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;

    try {
      // Optimistic removal
      setRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete));

      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeToDelete);
      if (error) throw error;

      setNotificationMessage("Recipe deleted successfully!");
      setNotificationType("success");
      setShowNotification(true);
      setSelectedRecipe(null);
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
    } catch (err) {
      console.error("Error deleting recipe:", err);
      setNotificationMessage("Failed to delete recipe");
      setNotificationType("error");
      setShowNotification(true);
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
      // Re-fetch to restore state
      if (chiefData) fetchRecipes(chiefData.expertise_area);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Chief Panel</h1>
                <p className="text-xs text-gray-400">
                  {chiefData?.expertise_area} Cuisine Expert
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-sm font-semibold text-white">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium border border-gray-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 font-medium">Total Recipes</h3>
              <ChefHat className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-4xl font-bold">{recipes.length}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 font-medium">Pending</h3>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold">
              {recipes.filter((r) => !r.is_approved).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 font-medium">Approved</h3>
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold">
              {recipes.filter((r) => r.is_approved).length}
            </p>
          </div>
        </div>

        {/* Recipe Management */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {chiefData?.expertise_area} Recipes
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === "pending"
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === "approved"
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Check className="w-4 h-4 inline mr-2" />
                Approved
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === "all"
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                    SN
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                    Recipe Title
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                    Author
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                    Difficulty
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No recipes found
                    </td>
                  </tr>
                ) : (
                  filteredRecipes.map((recipe, index) => (
                    <tr
                      key={recipe.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-4 px-4 text-gray-700">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {recipe.image_url && (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <span className="font-medium text-gray-900">
                            {recipe.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {recipe.users?.username ||
                          recipe.users?.email ||
                          "Unknown"}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {recipe.difficulty_level || "-"}
                      </td>
                      <td className="py-4 px-4">
                        {recipe.is_approved ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full inline-flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRecipe(recipe)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!recipe.is_approved ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveRecipe(recipe.id, true)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteRecipe(recipe.id)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                title="Deapprove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => deleteRecipe(recipe.id)}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              title="Deapprove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recipe Detail Modal */}
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

              <div className="space-y-6">
                {selectedRecipe.description && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedRecipe.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedRecipe.prep_time_minutes && (
                    <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                      <h4 className="font-semibold text-blue-900 text-sm">
                        Prep Time
                      </h4>
                      <p className="text-blue-700 font-bold text-lg mt-1">
                        {selectedRecipe.prep_time_minutes} min
                      </p>
                    </div>
                  )}

                  {selectedRecipe.cook_time_minutes && (
                    <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
                      <h4 className="font-semibold text-orange-900 text-sm">
                        Cook Time
                      </h4>
                      <p className="text-orange-700 font-bold text-lg mt-1">
                        {selectedRecipe.cook_time_minutes} min
                      </p>
                    </div>
                  )}

                  {selectedRecipe.servings && (
                    <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                      <h4 className="font-semibold text-green-900 text-sm">
                        Servings
                      </h4>
                      <p className="text-green-700 font-bold text-lg mt-1">
                        {selectedRecipe.servings}
                      </p>
                    </div>
                  )}

                  {selectedRecipe.difficulty_level && (
                    <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                      <h4 className="font-semibold text-purple-900 text-sm">
                        Difficulty
                      </h4>
                      <p className="text-purple-700 font-bold text-lg mt-1">
                        {selectedRecipe.difficulty_level}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                {selectedRecipe.ingredients && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      Ingredients
                    </h3>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients
                        .sort(
                          (a: string | RecipeItem, b: string | RecipeItem) => {
                            if (typeof a === "string" || typeof b === "string")
                              return 0;
                            const aOrder = (a as RecipeItem).order || 0;
                            const bOrder = (b as RecipeItem).order || 0;
                            return aOrder - bOrder;
                          },
                        )
                        .map((item: string | RecipeItem, i: number) => {
                          const text =
                            typeof item === "string" ? item : item.item;
                          return (
                            <li
                              key={i}
                              className="text-gray-700 flex items-start"
                            >
                              <span className="text-green-600 mr-2 mt-1">
                                •
                              </span>
                              <span>{text}</span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {selectedRecipe.instructions && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">
                      Instructions
                    </h3>
                    <ol className="space-y-3">
                      {selectedRecipe.instructions
                        .sort(
                          (a: string | RecipeItem, b: string | RecipeItem) => {
                            if (typeof a === "string" || typeof b === "string")
                              return 0;
                            const aOrder = (a as RecipeItem).order || 0;
                            const bOrder = (b as RecipeItem).order || 0;
                            return aOrder - bOrder;
                          },
                        )
                        .map((item: string | RecipeItem, i: number) => {
                          const text =
                            typeof item === "string" ? item : item.item;
                          return (
                            <li
                              key={i}
                              className="text-gray-700 flex items-start"
                            >
                              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{text}</span>
                            </li>
                          );
                        })}
                    </ol>
                  </div>
                )}

                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                  {!selectedRecipe.is_approved ? (
                    <div className="flex gap-3 flex-1">
                      <button
                        onClick={() => approveRecipe(selectedRecipe.id, true)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Check className="w-5 h-5 inline mr-2" />
                        Approve Recipe
                      </button>
                      <button
                        onClick={() => deleteRecipe(selectedRecipe.id)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <X className="w-5 h-5 inline mr-2" />
                        Reject Recipe
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => deleteRecipe(selectedRecipe.id)}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <X className="w-5 h-5 inline mr-2" />
                      Deapprove Recipe
                    </button>
                  )}
                  <button
                    onClick={() => deleteRecipe(selectedRecipe.id)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

      {/* Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    notificationType === "success"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {notificationType === "success" ? (
                    <Check className="text-green-600" size={24} />
                  ) : (
                    <X className="text-red-600" size={24} />
                  )}
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      notificationType === "success"
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {notificationType === "success" ? "Success" : "Error"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notificationMessage}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowNotification(false)}
                className={`px-6 py-3 rounded-xl font-medium ${
                  notificationType === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Confirm Delete
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete this recipe? This action
                    cannot be undone.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecipeToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecipeToDelete(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRecipe}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogoutModal(false)}
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
                  <p className="text-sm text-gray-500">Are you sure?</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
