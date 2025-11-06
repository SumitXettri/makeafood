"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Flame,
  Eye,
  Heart,
  Clock,
  Star,
  Users,
  ChefHat,
  Award,
  Crown,
  Sparkles,
  ChevronRight,
  Filter,
  Calendar,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Image from "next/image";

interface TrendingRecipe {
  id: string;
  title: string;
  image: string;
  category: string;
  area: string;
  views: number;
  likes: number;
  comments: number;
  rating: number;
  difficulty_level: "Easy" | "Medium" | "Hard";
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  author: string;
  trending_score: number;
  posted_date: string;
}

interface TrendingChef {
  id: string;
  name: string;
  avatar: string;
  recipes_count: number;
  followers: number;
  specialty: string;
}

export default function TrendingPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([]);
  const [chefs, setChefs] = useState<TrendingChef[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<
    "today" | "week" | "month" | "all"
  >("week");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  if (categoryFilter) {
    console.log("Category filter applied:", categoryFilter);
  }

  useEffect(() => {
    // Simulate API call - replace with actual Supabase query
    setTimeout(() => {
      setRecipes([
        {
          id: "1",
          title: "Spicy Korean Kimchi Fried Rice",
          image:
            "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&q=80",
          category: "Asian",
          area: "Korean",
          views: 45678,
          likes: 3421,
          comments: 234,
          rating: 4.9,
          difficulty_level: "Easy",
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          servings: 4,
          author: "Chef Kim",
          trending_score: 98,
          posted_date: "2 days ago",
        },
        {
          id: "2",
          title: "Classic Italian Carbonara",
          image:
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80",
          category: "Pasta",
          area: "Italian",
          views: 38921,
          likes: 2987,
          comments: 189,
          rating: 4.8,
          difficulty_level: "Medium",
          prep_time_minutes: 15,
          cook_time_minutes: 20,
          servings: 2,
          author: "Maria Rossi",
          trending_score: 95,
          posted_date: "1 day ago",
        },
        {
          id: "3",
          title: "Japanese Matcha Cheesecake",
          image:
            "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80",
          category: "Dessert",
          area: "Japanese",
          views: 52341,
          likes: 4532,
          comments: 312,
          rating: 4.9,
          difficulty_level: "Hard",
          prep_time_minutes: 30,
          cook_time_minutes: 60,
          servings: 8,
          author: "Yuki Tanaka",
          trending_score: 97,
          posted_date: "3 days ago",
        },
        {
          id: "4",
          title: "Mexican Street Tacos",
          image:
            "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
          category: "Mexican",
          area: "Mexican",
          views: 41203,
          likes: 3654,
          comments: 267,
          rating: 4.7,
          difficulty_level: "Easy",
          prep_time_minutes: 20,
          cook_time_minutes: 15,
          servings: 6,
          author: "Carlos Mendez",
          trending_score: 93,
          posted_date: "1 day ago",
        },
        {
          id: "5",
          title: "French Croissants from Scratch",
          image:
            "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
          category: "Baking",
          area: "French",
          views: 28765,
          likes: 2341,
          comments: 178,
          rating: 4.6,
          difficulty_level: "Hard",
          prep_time_minutes: 45,
          cook_time_minutes: 25,
          servings: 12,
          author: "Pierre Dubois",
          trending_score: 89,
          posted_date: "4 days ago",
        },
        {
          id: "6",
          title: "Thai Green Curry with Chicken",
          image:
            "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80",
          category: "Curry",
          area: "Thai",
          views: 36987,
          likes: 2876,
          comments: 201,
          rating: 4.8,
          difficulty_level: "Medium",
          prep_time_minutes: 15,
          cook_time_minutes: 30,
          servings: 4,
          author: "Nong Ploy",
          trending_score: 91,
          posted_date: "2 days ago",
        },
      ]);

      setChefs([
        {
          id: "1",
          name: "Chef Kim",
          avatar: "https://i.pravatar.cc/150?img=1",
          recipes_count: 127,
          followers: 45200,
          specialty: "Korean Cuisine",
        },
        {
          id: "2",
          name: "Maria Rossi",
          avatar: "https://i.pravatar.cc/150?img=5",
          recipes_count: 89,
          followers: 38900,
          specialty: "Italian Classics",
        },
        {
          id: "3",
          name: "Yuki Tanaka",
          avatar: "https://i.pravatar.cc/150?img=9",
          recipes_count: 156,
          followers: 52100,
          specialty: "Japanese Pastry",
        },
      ]);

      setLoading(false);
    }, 800);
  }, [timeFilter, categoryFilter]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-orange-100 text-orange-700";
      case "Hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded-lg w-96"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Navbar />
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900">
                Trending{" "}
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Now
                </span>
              </h1>
              <p className="text-gray-600 text-lg">
                The hottest recipes everyone's cooking
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="text-orange-500" size={24} />
                <span className="text-3xl font-bold text-gray-900">1.2M</span>
              </div>
              <p className="text-gray-600 text-sm">Views Today</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="text-red-500" size={24} />
                <span className="text-3xl font-bold text-gray-900">45K</span>
              </div>
              <p className="text-gray-600 text-sm">Likes Today</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="text-blue-500" size={24} />
                <span className="text-3xl font-bold text-gray-900">234</span>
              </div>
              <p className="text-gray-600 text-sm">New Recipes</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-green-500" size={24} />
                <span className="text-3xl font-bold text-gray-900">12K</span>
              </div>
              <p className="text-gray-600 text-sm">Active Chefs</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-md">
            <Calendar className="text-orange-500 ml-2" size={20} />
            {["today", "week", "month", "all"].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeFilter === filter
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-orange-50"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/search")}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-gray-700 hover:text-orange-600"
          >
            <Filter size={20} />
            Browse All Recipes
          </button>
        </div>

        {/* Top 3 Spotlight */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Crown className="text-yellow-500" size={32} />
            Top 3 This Week
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recipes.slice(0, 3).map((recipe, index) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
              >
                {/* Rank Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-xl ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                        : "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Image */}
                <div className="relative h-72 overflow-hidden">
                  <Image
                    width={150}
                    height={150}
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                  {/* Trending Score */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-full font-bold shadow-lg">
                      <Flame size={16} />
                      {recipe.trending_score}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                          recipe.difficulty_level
                        )}`}
                      >
                        {recipe.difficulty_level}
                      </span>
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 flex items-center gap-1">
                        <Clock size={12} />
                        {recipe.prep_time_minutes +
                          recipe.cook_time_minutes}{" "}
                        min
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                      {recipe.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {recipe.area} • by {recipe.author}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500">
                  <div className="grid grid-cols-3 gap-4 text-white text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye size={16} />
                        <span className="font-bold">
                          {formatNumber(recipe.views)}
                        </span>
                      </div>
                      <p className="text-xs opacity-90">Views</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart size={16} />
                        <span className="font-bold">
                          {formatNumber(recipe.likes)}
                        </span>
                      </div>
                      <p className="text-xs opacity-90">Likes</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star size={16} className="fill-white" />
                        <span className="font-bold">{recipe.rating}</span>
                      </div>
                      <p className="text-xs opacity-90">Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Trending Recipes */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="text-orange-500" size={32} />
            More Trending Recipes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.slice(3).map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    width={150}
                    height={150}
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-full font-bold text-sm shadow-lg">
                      <Flame size={14} />
                      {recipe.trending_score}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                        recipe.difficulty_level
                      )}`}
                    >
                      {recipe.difficulty_level}
                    </span>
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Clock size={12} />
                      {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition line-clamp-2">
                    {recipe.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {recipe.area} • by {recipe.author}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye size={16} className="text-orange-500" />
                        <span>{formatNumber(recipe.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="text-red-500" />
                        <span>{formatNumber(recipe.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} className="text-blue-500" />
                        <span>{recipe.comments}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className="text-orange-500 group-hover:translate-x-1 transition-transform"
                      size={20}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Chefs */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="text-orange-500" size={32} />
            Trending Chefs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chefs.map((chef) => (
              <div
                key={chef.id}
                onClick={() => router.push(`/chef/${chef.id}`)}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    width={150}
                    height={150}
                    src={chef.avatar}
                    alt={chef.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-orange-100 group-hover:ring-orange-300 transition-all"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition">
                      {chef.name}
                    </h3>
                    <p className="text-sm text-gray-600">{chef.specialty}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {chef.recipes_count}
                    </div>
                    <p className="text-xs text-gray-600">Recipes</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(chef.followers)}
                    </div>
                    <p className="text-xs text-gray-600">Followers</p>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
