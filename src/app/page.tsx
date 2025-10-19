"use client";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { FaUtensils, FaSearch } from "react-icons/fa";
import { MdOutlineAddCircleOutline } from "react-icons/md";

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    router.push(`/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-20 text-center relative">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-6">
          Cook. Share. Discover. <br />
          <span className="text-orange-600">MakeFood</span> 🍴
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
          Find recipes you’ll love, share your own creations, and explore global
          cuisines. Make cooking fun, easy, and inspiring.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => router.push("/submit-recipe")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white 
                       font-semibold rounded-xl shadow-md hover:scale-105 transition-transform"
          >
            <MdOutlineAddCircleOutline className="text-xl" />
            Share Your Recipe
          </button>

          <button
            onClick={() => router.push("/search")}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-orange-200 text-orange-700 
                       font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <FaSearch className="text-xl" />
            Explore Recipes
          </button>
        </div>

        {/* Quick search buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {["Pasta 🍝", "Curry 🍛", "Salad 🥗", "Dessert 🍰", "Soup 🍲"].map(
            (suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion.split(" ")[0])}
                className="px-5 py-2 bg-white border border-orange-200 text-orange-700 
                           rounded-full font-medium shadow-sm hover:shadow-md 
                           transition-all duration-200 hover:-translate-y-1"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </main>

      {/* Promo Section */}
      <section className="bg-gradient-to-r from-yellow-100 to-orange-100 py-16 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          🌟 Why Choose MakeFood?
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto mb-8">
          Whether you’re a beginner or a pro chef, MakeFood helps you discover,
          cook, and share recipes that bring people together.
        </p>
        <button
          onClick={() => router.push("/submit-recipe")}
          className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold 
                     hover:bg-orange-700 transition shadow-md"
        >
          Start Sharing Today
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-16">
        <div className="text-center text-gray-500">
          <p>👨‍🍳 Made with love for food lovers everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
