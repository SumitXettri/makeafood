"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  TrendingUp,
  Menu as MenuIcon,
  Plus,
  User,
  LogOut,
  X,
} from "lucide-react";
import Image from "next/image";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Fetch username from Supabase
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

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUsername();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
  };

  // Open login modal
  const openLoginModal = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  // Open signup modal
  const openSignupModal = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  // Unified search handler
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    router.push(`/recipes?query=${encodeURIComponent(trimmed)}`);
    setQuery("");
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-sm rounded-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                <Image src="/logo.svg" alt="Logo" width={34} height={34} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                MakeAfood
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="/recipes"
                className="text-gray-700 hover:text-orange-600 transition font-medium flex items-center gap-2"
              >
                <MenuIcon size={18} /> Recipes
              </a>
              <a
                href="/ingredient_search"
                className="text-gray-700 hover:text-orange-600 transition font-medium flex items-center gap-2"
              >
                <Search size={18} /> AI Search
              </a>
              <a
                href="/trending"
                className="text-gray-700 hover:text-orange-600 transition font-medium flex items-center gap-2"
              >
                <TrendingUp size={18} /> Community
              </a>
            </div>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative hidden lg:flex items-center"
            >
              <input
                type="text"
                placeholder="Search recipes..."
                className="w-64 px-4 py-2 pr-10 rounded-xl border border-orange-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 text-orange-600 hover:text-orange-700"
              >
                <Search size={18} />
              </button>
            </form>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {!username ? (
                <>
                  <button
                    onClick={openLoginModal}
                    className="px-5 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/addrecipe")}
                    className="px-5 py-2 bg-gradient-to-r cursor-pointer from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Share Recipe
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium">
                      <User size={16} />
                      <span>{username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Logout"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Buttons */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-700 hover:text-orange-600 transition"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-orange-600 transition"
              >
                {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <form
              onSubmit={handleSearchSubmit}
              className="lg:hidden mt-4 animate-in slide-in-from-top"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Go
                </button>
              </div>
            </form>
          )}

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-orange-100 space-y-3 animate-in slide-in-from-top">
              <a
                href="/recipes"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MenuIcon size={18} /> Recipes
              </a>
              <a
                href="/ingredient_search"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search size={18} /> AI Search
              </a>
              <a
                href="/trending"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <TrendingUp size={18} /> Community
              </a>

              {!username ? (
                <div className="flex flex-col gap-2 pt-3 border-t border-orange-100">
                  <button
                    onClick={openLoginModal}
                    className="px-4 py-2 text-center text-gray-700 border border-orange-200 rounded-lg hover:bg-orange-50 font-medium transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition text-center"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-3 border-t border-orange-100">
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium">
                    <User size={16} />
                    <span>{username}</span>
                  </div>
                  <button
                    onClick={() => {
                      router.push("/addrecipe");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Share Recipe
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
