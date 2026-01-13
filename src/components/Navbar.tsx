"use client";
import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Bell,
  BookOpen,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import Image from "next/image";
import AuthModal from "./AuthModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [initialEmail, setInitialEmail] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const auth = searchParams.get("auth");
    const email = searchParams.get("email");

    if (auth === "login" || auth === "signup") {
      setAuthMode(auth);
      setInitialEmail(email || "");
      setIsAuthModalOpen(true);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch username and admin status from Supabase
  const fetchUsername = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setUsername(null);
      setIsAdmin(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("username")
      .eq("id", authData.user.id)
      .single();

    const fetchedUsername = userData?.username || null;
    setUsername(fetchedUsername);

    // Check if username is "admin01" to determine admin status
    setIsAdmin(fetchedUsername === "Admin01");
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
      setDropdownOpen(false);
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
    setDropdownOpen(false);
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

    // If on community page, stay on community and pass query
    if (pathname === "/community") {
      router.push(`/community?query=${encodeURIComponent(trimmed)}`);
    } else {
      // Otherwise go to recipes page
      router.push(`/recipes?query=${encodeURIComponent(trimmed)}`);
    }

    setQuery("");
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-sm rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              onClick={() => router.push("/")}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={28}
                  height={28}
                  className="sm:w-[34px] sm:h-[34px]"
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                MakeAfood
              </span>
            </div>

            {/* Tablet/Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-3 lg:gap-6">
              <a
                href="/recipes"
                className="text-gray-700 hover:text-orange-600 transition font-medium flex items-center gap-2 text-sm lg:text-base"
              >
                <MenuIcon size={18} />
                <span className="hidden lg:inline">Recipes</span>
              </a>
              <a
                href="/ingredient_search"
                className="text-gray-700 hover:text-orange-600 transition font-medium flex items-center gap-2 text-sm lg:text-base"
              >
                <Search size={18} />
                <span className="hidden lg:inline">AI Search</span>
              </a>
              <a
                href="/community"
                className="text-gray-700 hover:text-orange-600 transition font-medium flex items-center gap-2 text-sm lg:text-base"
              >
                <TrendingUp size={18} />
                <span className="hidden lg:inline">Community</span>
              </a>
            </div>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative hidden xl:flex items-center"
            >
              <input
                type="text"
                placeholder="Search recipes..."
                className="w-56 xl:w-64 px-4 py-2 pr-10 rounded-xl border border-orange-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm"
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

            {/* Tablet/Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              {!username ? (
                <>
                  <button
                    onClick={openLoginModal}
                    className="px-3 lg:px-5 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm lg:text-base"
                  >
                    Login
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="px-3 lg:px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm lg:text-base whitespace-nowrap"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/addrecipe")}
                    className="px-3 lg:px-5 py-2 bg-gradient-to-r cursor-pointer from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 lg:gap-2 text-sm lg:text-base whitespace-nowrap"
                  >
                    <Plus size={16} className="lg:w-[18px] lg:h-[18px]" />
                    <span className="hidden lg:inline">Share Recipe</span>
                    <span className="lg:hidden">Share</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors text-sm lg:text-base"
                    >
                      <User size={14} className="lg:w-4 lg:h-4" />
                      <span className="max-w-[80px] lg:max-w-none truncate">
                        {username}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Content */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <LayoutDashboard size={18} />
                          <span className="font-medium">Dashboard</span>
                        </Link>

                        <Link
                          href="/myrecipe"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <BookOpen size={18} />
                          <span className="font-medium">My Recipes</span>
                        </Link>

                        <Link
                          href="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <Bell size={18} />
                          <span className="font-medium">Notifications</span>
                        </Link>

                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-200 my-2"></div>
                            <Link
                              href="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                              <Shield size={18} />
                              <span className="font-medium">Admin Panel</span>
                            </Link>
                          </>
                        )}

                        <div className="border-t border-gray-200 my-2"></div>

                        <button
                          onClick={openLogoutModal}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Buttons */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-700 hover:text-orange-600 transition"
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-orange-600 transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>

            {/* Tablet Search Button (between md and xl) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden md:flex xl:hidden p-2 text-gray-700 hover:text-orange-600 transition rounded-lg hover:bg-orange-50"
              aria-label="Toggle search"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Mobile/Tablet Search Bar */}
          {searchOpen && (
            <form
              onSubmit={handleSearchSubmit}
              className="xl:hidden mt-4 animate-in slide-in-from-top"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  className="w-full px-4 py-2.5 sm:py-3 pr-20 sm:pr-24 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm sm:text-base"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
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
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MenuIcon size={18} /> Recipes
              </a>
              <a
                href="/ingredient_search"
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search size={18} /> AI Search
              </a>
              <a
                href="/community"
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <TrendingUp size={18} /> Community
              </a>

              {!username ? (
                <div className="flex flex-col gap-2 pt-3 border-t border-orange-100">
                  <button
                    onClick={openLoginModal}
                    className="px-4 py-2.5 text-center text-gray-700 border border-orange-200 rounded-lg hover:bg-orange-50 font-medium transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition text-center"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-3 border-t border-orange-100">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/myrecipe"
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookOpen size={16} />
                    <span>My Recipes</span>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell size={16} />
                    <span>Notifications</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-purple-700 hover:bg-purple-50 rounded-lg transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield size={16} />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      router.push("/addrecipe");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Share Recipe
                  </button>
                  <button
                    onClick={openLogoutModal}
                    className="w-full px-4 py-2.5 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium transition flex items-center justify-center gap-2"
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
        initialEmail={initialEmail}
      />
    </>
  );
}
