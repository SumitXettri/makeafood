"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Trash2,
  Mail,
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
  user_id: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty_level: string;
  ingredients: string[] | RecipeItem[];
  instructions: string[] | RecipeItem[];
  is_approved: boolean;
  created_at: string;
  cuisine: string;
  users: RecipeUser;
}

interface RecipeItem {
  item: string;
  order: number;
}

interface Chief {
  id: string;
  user_id: string;
  expertise_area?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  certification?: string | null;
  approved_by?: string | null;
  is_active?: boolean;
  created_at?: string;
  users?: {
    id: string;
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}



export default function AdminPanel() {
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(
    null
  );
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [warningUser, setWarningUser] = useState<string | null>(null);
  const [chiefs, setChiefs] = useState<Chief[]>([]);
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null);
const [expertiseArea, setExpertiseArea] = useState("");
const [specialization, setSpecialization] = useState("");
const [experienceYears, setExperienceYears] = useState("");
const [certification, setCertification] = useState("");

  // Open logout modal helper
  const openLogoutModal = () => setShowLogoutModal(true);

 
  useEffect(() => {
    if (selectedRecipe ) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Lock body scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restore body scroll
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [selectedRecipe]);

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

  const checkUser = useCallback(async () => {
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
  }, []);

  const fetchRecipes = useCallback(async () => {
   


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
        query = query.eq("is_approved", false);
      } else if (statusFilter === "approved") {
        query = query.eq("is_approved", true);
      } else {
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

   

      if (data && data.length > 0) {
        console.log(
          "Recipe approval statuses:",
          data.map((r) => ({
            id: r.id,
            title: r.title,
            is_approved: r.is_approved,
          }))
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
    }
  }, [statusFilter, activeTab, user?.email]);

  const use = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter out admin users
      const adminEmails = ["admin01@gmail.com", "admin02@gmail.com"];
      const filteredData = data?.filter(user => !adminEmails.includes(user.email)) || [];
      
      setUsers(filteredData);
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
    }
  }, []);

  const deleteUser = async (userId: string, userEmail: string, username: string) => {
    const adminEmails = ["admin01@gmail.com", "admin02@gmail.com"];
    if (adminEmails.includes(userEmail)) {
      alert("Cannot delete admin users.");
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${username} (${userEmail})? This action cannot be undone.`)) {
      return;
    }

    setDeletingUser(userId);
    try {
      // Import supabaseAdmin dynamically only when needed
      const { supabaseAdmin } = await import("../../lib/supabaseAdmin");
      
      // Delete user from auth (requires admin privileges)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Delete user from users table (can use regular client)
      const { error: dbError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);
      if (dbError) throw dbError;

      // Refresh users list
      await use();
      alert(`User ${username} has been deleted successfully.`);
    } catch (err: unknown) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeletingUser(null);
    }
  };

  const fetchChiefs = async () => {
  try {
    console.log("→ Fetching chiefs...");
    const { data, error } = await supabase
      .from("chiefs")
      .select(`
        *,
        users:user_id (
          id,
          username,
          email,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    console.log("Chiefs data fetched:", data);
    setChiefs((data as Chief[]) || []);
  } catch (error) {
    console.error("Error fetching chiefs:", error);
  }
};

const upgradeToChief = async () => {
  if (!selectedUser || !expertiseArea) {
    alert("Please fill in required fields");
    return;
  }

  if (!user) {
    alert("No admin user available to approve this action.");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("chiefs")
      .insert([
        {
          id: crypto.randomUUID(),
          user_id: selectedUser.id,
          expertise_area: expertiseArea,
          specialization: specialization || null,
          experience_years: experienceYears ? parseInt(experienceYears) : null,
          certification: certification || null,
          approved_by: user.id,
          is_active: true,
        },
      ])
      .select();

    if (error) throw error;

    alert(`${selectedUser.username || selectedUser.email} upgraded to Chief successfully!`);
    setShowUpgradeModal(false);
    setSelectedUser(null);
    setExpertiseArea("");
    setSpecialization("");
    setExperienceYears("");
    setCertification("");
    fetchChiefs();
  } catch (error) {
    console.error("Error upgrading to chief:", error);
    alert("Failed to upgrade user to chief");
  }
};
const downgradeChief = async (chiefId: string, userId: string) => {
  if (!confirm("Are you sure you want to remove chief status?")) return;

  try {
    const { error } = await supabase
      .from("chiefs")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    alert("Chief status removed successfully!");
    fetchChiefs();
  } catch (error) {
    console.error("Error downgrading chief:", error);
    alert("Failed to remove chief status");
  }
};

  const sendWarning = async (userEmail: string, username: string) => {
    const reason = prompt("Enter the reason for the warning:", "Violation of community guidelines");
    if (!reason) return;

    setWarningUser(userEmail);
    try {
      const response = await fetch("/api/send-warning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          username,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send warning email");
      }

      alert(`Warning email sent to ${username} successfully.`);
    } catch (err: unknown) {
      console.error("Error sending warning email:", err);
      alert("Failed to send warning email. Please try again.");
    } finally {
      setWarningUser(null);
    }
  };

  useEffect(() => {
 
    checkUser();
  }, [checkUser]);

  useEffect(() => {
   

    if (user) {
      if (activeTab === "recipes") {
        fetchRecipes();
      }
      if (activeTab === "users") {
        use();
      }
      if (activeTab === "chefs") {
        fetchChiefs();
      }
    } else {
      console.log("⚠️ No user logged in, skipping fetch");
    }
  }, [user, activeTab, statusFilter, fetchRecipes, use, fetchChiefs]);
 
  // Real-time subscription
  useEffect(() => {
    if (!user || activeTab !== "recipes") {
      return;
    }


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
  }, [user, activeTab, statusFilter, fetchRecipes]);

  // Log filtered recipes
  useEffect(() => {
    
    const filtered = recipes.filter(
      (r) =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.users?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("Filtered results:", filtered.length);
  }, [recipes, searchTerm]);

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

  const approveRecipe = async (recipeId: string, approved: boolean) => {
  

    try {
      console.log("Optimistically updating local state...");
      setRecipes((prevRecipes) => {
        const updated = prevRecipes.map((recipe) =>
          recipe.id === recipeId ? { ...recipe, is_approved: approved } : recipe
        );
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

        console.log(data)

      if (error) {
        console.error("❌ Supabase update error:", error);
        throw error;
      }

     
      await fetchRecipes();

      setSelectedRecipe(null);
      console.log("Modal closed");
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
      return;
    }



    try {
      console.log("Optimistically removing from local state...");
      setRecipes((prevRecipes) => {
        const filtered = prevRecipes.filter((recipe) => recipe.id !== recipeId);
        return filtered;
      });

      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) {
        console.error("❌ Supabase delete error:", error);
        throw error;
      }

      setSelectedRecipe(null);
    } catch (err: unknown) {
      console.error("❌ Error deleting recipe:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        error: err,
      });
      alert("Failed to delete recipe");

      await fetchRecipes();
    }
  };

  const filteredRecipes = recipes.filter(
    (r) =>
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.users?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users based on active tab and search
const filteredUsers = (() => {
  let filtered = users;

  // Filter out chiefs from users tab
  if (activeTab === "users") {
    const chiefUserIds = chiefs.map(c => c.user_id);
    filtered = filtered.filter(u => !chiefUserIds.includes(u.id));
  }

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(
      (u) =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return filtered;
})();


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

if (!user) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Admin Panel
        </h1>
        <p className="text-center text-gray-500 mb-8">
          MakeAFood Administration
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              placeholder="Enter admin password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-md hover:shadow-lg mt-6"
          >
            Sign In
          </button>
        </form>
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                MakeAFood<span className="text-orange-500">Manager</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-1 ml-8">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "dashboard"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("recipes")}
                className={`px-4 py-2 rounded-lg font-medium transition relative ${
                  activeTab === "recipes"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Recipes
                {recipes.filter((r) => !r.is_approved).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {recipes.filter((r) => !r.is_approved).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("chefs")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "chefs"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Chefs
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "users"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Users
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-400">Welcome,</p>
              <p className="text-sm font-semibold text-white">{user.email}</p>
            </div>
            <button
              onClick={openLogoutModal}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium border border-gray-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome, <span className="text-orange-600">Admin</span>
            </h2>
            <button
              onClick={fetchRecipes}
              disabled={fetchingRecipes}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              <svg
                className={`w-5 h-5 ${fetchingRecipes ? "animate-spin" : ""}`}
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
              <span>Refresh</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-orange-500 opacity-10 rounded-tl-full"></div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 font-medium">Total Recipes</h3>
                <ChefHat className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-4xl font-bold">{recipes.length}</p>
              <div className="absolute bottom-3 left-6 w-12 h-1 bg-orange-500 rounded"></div>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-tl-full"></div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 font-medium">Approved</h3>
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-4xl font-bold">
                {recipes.filter((r) => r.is_approved).length}
              </p>
              <div className="absolute bottom-3 left-6 w-12 h-1 bg-green-500 rounded"></div>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-yellow-500 opacity-10 rounded-tl-full"></div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 font-medium">Pending</h3>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-4xl font-bold">
                {recipes.filter((r) => !r.is_approved).length}
              </p>
              <div className="absolute bottom-3 left-6 w-12 h-1 bg-yellow-500 rounded"></div>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-tl-full"></div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 font-medium">Total Users</h3>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-4xl font-bold">{users.length}</p>
              <div className="absolute bottom-3 left-6 w-12 h-1 bg-blue-500 rounded"></div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Recent Recipes</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recipes.slice(0, 5).map((recipe) => (
                <div key={recipe.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{recipe.title}</h4>
                        <p className="text-sm text-gray-500">
                          By: {recipe.users?.username || recipe.users?.email || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        recipe.is_approved
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {recipe.is_approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === "recipes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-900">Recipe Management</h2>
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

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">SN</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Recipe Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Author</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Cuisine</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Difficulty</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
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
                            <span className="font-medium text-gray-900">{recipe.title}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {recipe.users?.username || recipe.users?.email || "Unknown"}
                        </td>
                        <td className="py-4 px-4 text-gray-700">{recipe.cuisine || "-"}</td>
                        <td className="py-4 px-4 text-gray-700">{recipe.difficulty_level || "-"}</td>
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
                              <button
                                onClick={() => approveRecipe(recipe.id, true)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => approveRecipe(recipe.id, false)}
                                className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                title="Unapprove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteRecipe(recipe.id)}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              title="Delete"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
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
      )}

      {/* Chefs Tab */}
      {activeTab === "chefs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Chief Chefs Management</h2>
            <button
              onClick={() => setActiveTab("users")}              
              className="px-4 py-2 cursor-pointer bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
            >
              <ChefHat className="w-4 h-4 inline mr-2" />
              Upgrade User
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search chiefs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">SN</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Chief Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Expertise Area</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Specialization</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Experience</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chiefs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No chief chefs found. Upgrade users to chief chefs.
                      </td>
                    </tr>
                  ) : (
                    chiefs
                      .filter(
                        (chief) =>
                          chief.users?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          chief.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          chief.expertise_area?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((chief, index) => (
                        <tr
                          key={chief.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="py-4 px-4 text-gray-700">{index + 1}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              {chief.users?.avatar_url ? (
                                <img
                                  src={chief.users.avatar_url}
                                  alt={chief.users?.username || "Chief"}
                                  className="w-10 h-10 object-cover rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <span className="text-orange-600 font-semibold">
                                    {(chief.users?.username || chief.users?.email)?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {chief.users?.username || "No username"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-700">{chief.users?.email}</td>
                          <td className="py-4 px-4 text-gray-700">{chief.expertise_area || "-"}</td>
                          <td className="py-4 px-4 text-gray-700">{chief.specialization || "-"}</td>
                          <td className="py-4 px-4 text-gray-700">
                            {chief.experience_years ? `${chief.experience_years} years` : "-"}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => downgradeChief(chief.id, chief.user_id)}
                                className="p-2 cursor-pointer bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                title="Downgrade Chief"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
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
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">SN</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">User Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, index) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-4 px-4 text-gray-700">{index + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.username}
                                className="w-10 h-10 object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {(u.username || u.email)?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-gray-900">
                              {u.username || "No username"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{u.email}</td>
                        <td className="py-4 px-4 text-gray-700">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => sendWarning(u.email, u.username || "User")}
                              disabled={warningUser === u.email}
                              className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                              title="Send Warning"
                            >
                              {warningUser === u.email ? (
                                <Clock className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteUser(u.id, u.email, u.username || "User")}
                              disabled={deletingUser === u.id}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingUser === u.id ? (
                                <Clock className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowUpgradeModal(true);
                                }}
                                className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                                title="Upgrade to Chief"
                            >
                              <ChefHat className="w-4 h-4" />
                            </button>
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
      )}
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

              {selectedRecipe.ingredients && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">
                    Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients
                      .sort((a, b) => {
                        if (typeof a === "string" || typeof b === "string")
                          return 0;
                        const aOrder = (a as RecipeItem).order || 0;
                        const bOrder = (b as RecipeItem).order || 0;
                        return aOrder - bOrder;
                      })
                      .map((item, i) => {
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

              {selectedRecipe.instructions && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">
                    Instructions
                  </h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions
                      .sort((a, b) => {
                        if (typeof a === "string" || typeof b === "string")
                          return 0;
                        const aOrder = (a as RecipeItem).order || 0;
                        const bOrder = (b as RecipeItem).order || 0;
                        return aOrder - bOrder;
                      })
                      .map((item, i) => {
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
                  <button
                    onClick={() => approveRecipe(selectedRecipe.id, true)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    Approve Recipe
                  </button>
                ) : (
                  <button
                    onClick={() => approveRecipe(selectedRecipe.id, false)}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-3 rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Unapprove Recipe
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

    {/* Logout Modal */}
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Upgrade to Chief Modal */}
{showUpgradeModal && selectedUser && (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    onClick={() => setShowUpgradeModal(false)}
  >
    <div
      className="bg-white rounded-2xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upgrade to Chief</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedUser.username || selectedUser.email}
          </p>
        </div>
        <button
          onClick={() => setShowUpgradeModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Expertise Area <span className="text-red-500">*</span>
          </label>
          <select
            value={expertiseArea}
            onChange={(e) => setExpertiseArea(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">Select expertise area</option>
            <option value="Nepali">Nepali Cuisine</option>
            <option value="Italian">Italian Cuisine</option>
            <option value="Chinese">Chinese Cuisine</option>
            <option value="Indian">Indian Cuisine</option>
            <option value="Mexican">Mexican Cuisine</option>
            <option value="French">French Cuisine</option>
            <option value="Japanese">Japanese Cuisine</option>
            <option value="Thai">Thai Cuisine</option>
            <option value="Mediterranean">Mediterranean Cuisine</option>
            <option value="American">American Cuisine</option>
            <option value="Baking">Baking & Pastry</option>
            <option value="Desserts">Desserts</option>
            <option value="Vegan">Vegan Cuisine</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Specialization
          </label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g., Pasta Making, Sushi, BBQ"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Experience (Years)
          </label>
          <input
            type="number"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="Years of cooking experience"
            min="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Certification
          </label>
          <input
            type="text"
            value={certification}
            onChange={(e) => setCertification(e.target.value)}
            placeholder="e.g., Culinary Institute of America"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowUpgradeModal(false)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition"
        >
          Cancel
        </button>
        <button
          onClick={upgradeToChief}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition"
        >
          Upgrade to Chief
        </button>
      </div>
    </div>
  </div>
)}
  </div>
);
}
