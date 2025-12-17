"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

// Update the Recipe interface to include is_approved
interface Recipe {
  id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  is_approved: boolean; // ✅ ADD THIS
  created_at: string;
  image_url: string | null;
  cuisine: string | null;
  difficulty_level: string | null;
  likes: number;
  views: number;
  comment_count: number;
}

// Update the activeTab to include pending

function Dashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "public" | "private" | "pending" | "approved"
  >("all"); // ✅ ADD "approved"

  // Update stats to include pending count
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    pending: 0, // ✅ ADD THIS
    approved: 0, // ✅ ADD THIS
    likes: 0,
    views: 0,
    comments: 0,
  });
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", avatar_url: "" });
  const [uploading, setUploading] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCurrentUser(profile);
        setForm({
          username: profile.username || "",
          bio: profile.bio || "",
          avatar_url: profile.avatar_url || "",
        });
      }

      // Fetch followers/following counts (you'll need to create these tables)
      const [followersData, followingData] = await Promise.all([
        supabase.from("followers").select("*").eq("following_id", user.id),
        supabase.from("followers").select("*").eq("follower_id", user.id),
      ]);

      setFollowers(followersData.data?.length || 0);
      setFollowing(followingData.data?.length || 0);

      const { data: recipesData } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (recipesData) {
        const ids = recipesData.map((r) => r.id);
        const [likes, comments] = await Promise.all([
          supabase
            .from("recipe_likes")
            .select("recipe_id")
            .in("recipe_id", ids),
          supabase.from("comments").select("recipe_id").in("recipe_id", ids),
        ]);

        const likeMap = new Map();
        likes.data?.forEach((l) =>
          likeMap.set(l.recipe_id, (likeMap.get(l.recipe_id) || 0) + 1)
        );
        const commentMap = new Map();
        comments.data?.forEach((c) =>
          commentMap.set(c.recipe_id, (commentMap.get(c.recipe_id) || 0) + 1)
        );

        const enriched = recipesData.map((r) => ({
          ...r,
          likes: likeMap.get(r.id) || 0,
          comment_count: commentMap.get(r.id) || 0,
        }));

        setRecipes(enriched);
        // Replace the setStats call with this:
        setStats({
          total: enriched.length,
          public: enriched.filter((r) => r.is_public).length,
          private: enriched.filter((r) => !r.is_public).length,
          pending: enriched.filter((r) => !r.is_approved).length, // ✅ ADD THIS
          approved: enriched.filter((r) => r.is_approved).length, // ✅ ADD THIS
          likes: enriched.reduce((sum, r) => sum + r.likes, 0),
          views: enriched.reduce((sum, r) => sum + r.views, 0),
          comments: enriched.reduce((sum, r) => sum + r.comment_count, 0),
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUser?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setForm({ ...form, avatar_url: data.publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    if (!currentUser) return;
    try {
      await supabase.from("users").update(form).eq("id", currentUser.id);
      setCurrentUser({ ...currentUser, ...form });
      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch {
      alert("Failed to update profile");
    }
  };

  const deleteRecipe = async (id: number) => {
    if (!confirm("Delete this recipe?")) return;
    try {
      await supabase.from("recipes").delete().eq("id", id);
      fetchData();
    } catch {
      alert("Failed to delete recipe");
    }
  };

  const toggleVisibility = async (id: number, isPublic: boolean) => {
    try {
      await supabase
        .from("recipes")
        .update({ is_public: !isPublic })
        .eq("id", id);
      fetchData();
    } catch {
      alert("Failed to update visibility");
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Replace the filtered recipes logic with this:
  const filtered = recipes.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "public") return r.is_public;
    if (activeTab === "private") return !r.is_public;
    if (activeTab === "pending") return !r.is_approved;
    if (activeTab === "approved") return r.is_approved;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 relative">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex-shrink-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-4xl font-bold">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 pt-6 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {currentUser.username}
                    </h1>
                    <p className="text-gray-600">{currentUser.email}</p>
                    {currentUser.bio && (
                      <p className="text-gray-700 mt-2 max-w-2xl">
                        {currentUser.bio}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2 self-start md:self-auto"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-6 text-center md:text-left">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                    <p className="text-sm text-gray-600">Recipes</p>
                  </div>
                  <div className="cursor-pointer hover:opacity-80 transition-opacity">
                    <p className="text-2xl font-bold text-gray-900">
                      {followers}
                    </p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                  <div className="cursor-pointer hover:opacity-80 transition-opacity">
                    <p className="text-2xl font-bold text-gray-900">
                      {following}
                    </p>
                    <p className="text-sm text-gray-600">Following</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: "📚", color: "orange" },
            {
              label: "Approved",
              value: stats.approved,
              icon: "✅",
              color: "green",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: "⏳",
              color: "yellow",
            },
            {
              label: "Public",
              value: stats.public,
              icon: "🌍",
              color: "green",
            },
            {
              label: "Private",
              value: stats.private,
              icon: "🔒",
              color: "gray",
            },
            { label: "Likes", value: stats.likes, icon: "❤️", color: "red" },
            { label: "Views", value: stats.views, icon: "👁️", color: "blue" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <p className={`text-3xl font-bold text-${stat.color}-600`}>
                  {stat.value}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* My Recipes Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">My Recipes</h2>
            <Link
              href="/addrecipe"
              className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Recipe
            </Link>
          </div>

          {/* Tabs */}
          {/* Replace the tabs section with this: */}
          <div className="flex gap-1 px-6 border-b bg-gray-50">
            {[
              { key: "all", label: "All", count: stats.total },
              { key: "approved", label: "Approved", count: stats.approved },
              { key: "pending", label: "Pending Review", count: stats.pending },
              { key: "public", label: "Public", count: stats.public },
              { key: "private", label: "Private", count: stats.private },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() =>
                  setActiveTab(
                    tab.key as
                      | "all"
                      | "public"
                      | "private"
                      | "pending"
                      | "approved"
                  )
                }
                className={`px-6 py-4 font-semibold transition-colors relative ${
                  activeTab === tab.key
                    ? "text-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Recipes Grid */}
          <div className="p-6">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No recipes yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start creating and sharing your culinary masterpieces!
                </p>
                <Link
                  href="/addrecipe"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="group bg-white border-2 border-gray-100 rounded-xl overflow-hidden hover:border-orange-200 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Recipe Image */}
                    <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-20 h-20 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {/* Approval Status */}
                        {recipe.is_approved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm bg-green-100/90 text-green-700">
                            ✅ Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm bg-yellow-100/90 text-yellow-700">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      {/* Difficulty Badge */}
                      {recipe.difficulty_level && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-700">
                            {recipe.difficulty_level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Recipe Info */}
                    <div className="p-5">
                      <div className="mb-3">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {recipe.title}
                        </h3>
                        {recipe.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b">
                        <span className="flex items-center gap-1.5">
                          <span className="text-red-500">❤️</span>
                          <span className="font-medium text-gray-700">
                            {recipe.likes}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-blue-500">👁️</span>
                          <span className="font-medium text-gray-700">
                            {recipe.views}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-purple-500">💬</span>
                          <span className="font-medium text-gray-700">
                            {recipe.comment_count}
                          </span>
                        </span>
                      </div>

                      {/* Cuisine & Date */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        {recipe.cuisine && (
                          <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-md font-medium">
                            {recipe.cuisine}
                          </span>
                        )}
                        <span>{getTimeAgo(recipe.created_at)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/recipe/${recipe.id}`}
                          className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-center font-medium hover:bg-orange-600 transition-colors"
                        >
                          View Recipe
                        </Link>
                        <button
                          onClick={() =>
                            toggleVisibility(recipe.id, recipe.is_public)
                          }
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          title={
                            recipe.is_public ? "Make Private" : "Make Public"
                          }
                        >
                          {recipe.is_public ? "🔓" : "🔒"}
                        </button>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete Recipe"
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
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                    {form.avatar_url ? (
                      <img
                        src={form.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer font-medium">
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            Upload Image
                          </>
                        )}
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.bio.length}/200 characters
                </p>
              </div>

              {/* Avatar URL (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Avatar URL{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.avatar_url}
                  onChange={(e) =>
                    setForm({ ...form, avatar_url: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateProfile}
                className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
