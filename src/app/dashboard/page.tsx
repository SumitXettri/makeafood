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

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  image_url: string | null;
  cuisine: string | null;
  difficulty_level: string | null;
  likes: number;
  views: number;
  comment_count: number;
}

function Dashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    likes: 0,
    views: 0,
    comments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "public" | "private">(
    "all"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", avatar_url: "" });

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
        setStats({
          total: enriched.length,
          public: enriched.filter((r) => r.is_public).length,
          private: enriched.filter((r) => !r.is_public).length,
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

  const updateProfile = async () => {
    if (!currentUser) return;
    try {
      await supabase.from("users").update(form).eq("id", currentUser.id);
      setCurrentUser({ ...currentUser, ...form });
      setIsEditing(false);
      alert("Profile updated!");
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  const deleteRecipe = async (id: number) => {
    if (!confirm("Delete this recipe?")) return;
    try {
      await supabase.from("recipes").delete().eq("id", id);
      fetchData();
    } catch (error) {
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
    } catch (error) {
      alert("Failed to update visibility");
    }
  };

  const filtered = recipes.filter((r) =>
    activeTab === "all"
      ? true
      : activeTab === "public"
      ? r.is_public
      : !r.is_public
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                currentUser.username.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="Username"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Bio"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={form.avatar_url}
                    onChange={(e) =>
                      setForm({ ...form, avatar_url: e.target.value })
                    }
                    placeholder="Avatar URL"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={updateProfile}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold">
                      {currentUser.username}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      Edit Profile
                    </button>
                  </div>
                  <p className="text-gray-600 mb-2">{currentUser.email}</p>
                  {currentUser.bio && (
                    <p className="text-gray-700">{currentUser.bio}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            {
              label: "Recipes",
              value: stats.total,
              color: "orange",
              icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            },
            {
              label: "Public",
              value: stats.public,
              color: "green",
              icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              label: "Private",
              value: stats.private,
              color: "gray",
              icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
            },
            {
              label: "Likes",
              value: stats.likes,
              color: "red",
              icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
            },
            {
              label: "Views",
              value: stats.views,
              color: "blue",
              icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            },
            {
              label: "Comments",
              value: stats.comments,
              color: "purple",
              icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recipes */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">My Recipes</h2>
            <Link
              href="/create-recipe"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              + Create Recipe
            </Link>
          </div>

          <div className="flex gap-4 px-4 border-b">
            {[
              { key: "all", label: `All (${stats.total})` },
              { key: "public", label: `Public (${stats.public})` },
              { key: "private", label: `Private (${stats.private})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-2 font-medium border-b-2 ${
                  activeTab === tab.key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No recipes yet</p>
                <Link
                  href="/create-recipe"
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg inline-block hover:bg-orange-600"
                >
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {recipe.image_url && (
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                            recipe.is_public
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {recipe.is_public ? "Public" : "Private"}
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex gap-3 text-sm text-gray-600 mb-3">
                        <span>❤️ {recipe.likes}</span>
                        <span>👁️ {recipe.views}</span>
                        <span>💬 {recipe.comment_count}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/recipe/${recipe.id}`}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded text-center hover:bg-orange-600"
                        >
                          View
                        </Link>
                        <button
                          onClick={() =>
                            toggleVisibility(recipe.id, recipe.is_public)
                          }
                          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          {recipe.is_public ? "🔓" : "🔒"}
                        </button>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
    </div>
  );
}

export default Dashboard;
