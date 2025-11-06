"use client";
import { useState } from "react";
import {
  Utensils,
  Search,
  Flame,
  Clock,
  Star,
  Heart,
  ChevronRight,
  Leaf,
  Pizza,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const todaySpecials = [
    {
      id: 1,
      idd: "s-646512",
      title: "Salmon Caesar Salad",
      image: "https://img.spoonacular.com/recipes/646512-556x370.jpg",
      time: "25 min",
      difficulty: "Medium",
      rating: 4.8,
      cuisine: "Italian",
      color: "from-orange-400 to-red-500",
    },
    {
      id: 2,
      idd: "m-52814",
      title: "Thai Green Curry",
      image:
        "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&q=80",
      time: "30 min",
      difficulty: "Easy",
      rating: 4.9,
      cuisine: "Thai",
      color: "from-green-400 to-emerald-600",
    },
    {
      id: 3,
      idd: "s-631877",
      title: "5 minute Tiramisu",
      image: "https://img.spoonacular.com/recipes/631877-312x231.jpg",
      time: "45 min",
      difficulty: "Hard",
      rating: 4.7,
      cuisine: "Dessert",
      color: "from-amber-400 to-orange-500",
    },
    {
      id: 4,
      idd: "s-648506",
      title: "Sushi",
      image: "https://img.spoonacular.com/recipes/648506-556x370.jpg",
      time: "20 min",
      difficulty: "Easy",
      rating: 4.6,
      cuisine: "Japanese",
      color: "from-red-400 to-pink-500",
    },
    {
      id: 5,
      idd: "m-53036",
      title: "Boxty Breakfast",
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80",
      time: "35 min",
      difficulty: "Medium",
      rating: 4.5,
      cuisine: "Irish",
      color: "from-yellow-400 to-amber-600",
    },
    {
      id: 6,
      idd: "m-52947",
      title: "Ma Po Tofu",
      image: "https://www.themealdb.com/images/media/meals/1525874812.jpg",
      time: "40 min",
      difficulty: "Hard",
      rating: 4.8,
      cuisine: "Chinese",
      color: "from-amber-400 to-yellow-600",
    },
    {
      id: 7,
      idd: "s-649349",
      title: "Vegan Buddha Bowl",
      image: "https://img.spoonacular.com/recipes/649349-556x370.jpg",
      time: "15 min",
      difficulty: "Easy",
      rating: 4.9,
      cuisine: "Vegan",
      color: "from-green-400 to-lime-600",
    },
  ];

  const categories = [
    {
      name: "Quick Meals",
      icon: <Clock size={32} />,
      color: "bg-orange-100 text-orange-600",
      count: "234+",
    },
    {
      name: "Healthy",
      icon: <Leaf size={32} />,
      color: "bg-green-100 text-green-600",
      count: "189+",
    },
    {
      name: "Desserts",
      icon: <span className="text-3xl">🧁</span>,
      color: "bg-pink-100 text-pink-600",
      count: "156+",
    },
    {
      name: "Asian",
      icon: <span className="text-3xl">🍜</span>,
      color: "bg-red-100 text-red-600",
      count: "298+",
    },
    {
      name: "Italian",
      icon: <Pizza size={32} />,
      color: "bg-yellow-100 text-yellow-700",
      count: "210+",
    },
    {
      name: "Comfort Food",
      icon: <span className="text-3xl">🍗</span>,
      color: "bg-amber-100 text-amber-600",
      count: "167+",
    },
  ];

  const trendingSearches = [
    "Vegan Bowl",
    "Pasta Carbonara",
    "Chicken Tikka",
    "Chocolate Cake",
    "Stir Fry",
  ];

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    console.log("Searching for:", hoveredCard);
    router.push(`/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Enhanced Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-2">
              <Flame className="text-orange-500" size={16} /> Trending Now
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Discover Your Next
            <br />
            <span className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Favorite Recipe
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of food lovers sharing and discovering amazing
            recipes from around the world
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ingredients, cuisine, or dish name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-5 rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-lg shadow-lg"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              <Search onClick={() => handleSearch(searchQuery)} size={20} />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-sm text-gray-500">Trending:</span>
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="text-sm px-3 py-1 bg-white rounded-full border border-orange-200 text-orange-700 hover:bg-orange-50 transition"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Today's Special Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="text-4xl">✨</span> Today&#39;s Special
              </h2>
              <p className="text-gray-600">
                Handpicked recipes curated by our chefs
              </p>
            </div>
            <button className="hidden sm:flex items-center gap-2 text-orange-600 font-semibold hover:gap-3 transition-all">
              View All <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {todaySpecials.map((recipe) => (
              <div
                key={recipe.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                onClick={() => router.push(`/recipe/${recipe.idd}`)}
                onMouseEnter={() => setHoveredCard(recipe.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    width={120}
                    height={120}
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${recipe.color} opacity-20 group-hover:opacity-40 transition-opacity`}
                  ></div>
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition">
                    <Heart className="text-red-500" size={20} />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                      {recipe.cuisine}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-orange-600 transition">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="text-orange-500" size={16} />
                      <span>{recipe.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star
                        className="text-yellow-500 fill-yellow-500"
                        size={16}
                      />
                      <span className="font-semibold">{recipe.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span
                      className={`text-xs font-medium ${
                        recipe.difficulty === "Easy"
                          ? "text-green-600"
                          : recipe.difficulty === "Medium"
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.name}
                className={`${category.color} p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform flex justify-center">
                  {category.icon}
                </div>
                <h3 className="font-bold text-sm mb-1">{category.name}</h3>
                <p className="text-xs opacity-75">{category.count}</p>
              </button>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">
              Share Your Culinary Masterpiece
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join our community of passionate cooks and inspire others with
              your recipes
            </p>
            <button className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl">
              Start Sharing Today
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Utensils className="text-white" size={16} />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  MakeFood
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                Making cooking accessible and fun for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Recipes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Categories
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Trending
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Share Recipe
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Join Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 MakeFood. Made with ❤️ for food lovers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
