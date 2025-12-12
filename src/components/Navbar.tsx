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
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import AuthModal from "./AuthModal";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // Updated logout handler with confirmation
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setMobileMenuOpen(false);
      setShowLogoutModal(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Open logout modal
  const openLogoutModal = () => {
    setShowLogoutModal(true);
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
                href="/community"
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
                      <Link href="/profile" className="flex items-center gap-2">
                        <User size={16} />
                        <span>{username}</span>
                      </Link>
                    </div>
                    <button
                      onClick={openLogoutModal}
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
                href="/community"
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
                    onClick={openLogoutModal}
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoggingOut) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Confirm Logout
                  </h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to leave?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="mb-6">
              <p className="text-gray-600">
                You will be signed out of your account. You can always sign back
                in anytime.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
