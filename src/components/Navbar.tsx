"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState<string | null>(null);

  // Fetch username
  const fetchUsername = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setUsername(null);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("username")
      .eq("id", authData.user.id)
      .single();

    setUsername(userData?.username || null);
  };

  useEffect(() => {
    fetchUsername();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUsername();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
      setQuery("");
    }
  };

  return (
    <nav className="bg-gradient-to-r from-green-700 to-emerald-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 font-bold text-xl sm:text-2xl cursor-pointer"
          onClick={() => router.push("/")}
        >
          <span className="text-yellow-300">🍲</span>
          <span className="tracking-tight">MakeAfood</span>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex w-full sm:w-auto">
          <div className="relative flex items-center w-full">
            <div className="absolute left-3 text-gray-500 pointer-events-none">
              🔍
            </div>
            <input
              type="text"
              placeholder="Search recipes, e.g. 'chicken curry'..."
              className="pl-10 pr-4 py-2 w-full sm:w-80 rounded-l-lg rounded-r-none border-0 outline-none text-gray-800 font-medium placeholder-gray-500 transition-all duration-200 focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search recipes"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 px-6 py-2 font-semibold text-gray-900 rounded-r-lg rounded-l-none transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-50"
              aria-label="Submit search"
            >
              Search
            </button>
          </div>
        </form>

        {/* Auth Buttons or Profile */}
        <div className="flex gap-2">
          {!username ? (
            <>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-transparent border border-white rounded-lg hover:bg-white hover:text-green-800 transition font-medium"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 font-semibold transition"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-white text-green-800 px-3 py-1 rounded-full font-medium cursor-pointer">
                {username}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 rounded-lg text-white hover:bg-red-600 transition font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
