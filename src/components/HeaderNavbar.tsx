"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

interface HeaderNavbarProps {
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
}

function HeaderNavbar({
  toggleSidebar,
  sidebarWidth,
  setSidebarWidth,
}: HeaderNavbarProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChief, setIsChief] = useState(false);
  const [initials, setInitials] = useState("U");

  // Fetch current user profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get profile from profiles table — adjust table/column names to match yours
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username || user.email?.split("@")[0] || "User");
        setIsAdmin(profile.role === "admin");
        setIsChief(profile.role === "chief");
        const name = profile.username || user.email || "U";
        setInitials(name.slice(0, 2).toUpperCase());
      } else {
        // Fallback to email
        const name = user.email?.split("@")[0] || "User";
        setUsername(name);
        setInitials(name.slice(0, 2).toUpperCase());
      }
    };
    fetchProfile();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleWidthChange = (delta: number) => {
    setSidebarWidth((prev) => Math.min(Math.max(prev + delta, 240), 400));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div
      className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20 flex-shrink-0"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Left: menu + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={60}
              height={60}
              className="text-orange-400  transition-colors"
            />
          </div>
          <span className="text-sm font-semibold text-gray-800 hidden sm:block">
            Chef Assistant
          </span>
        </div>
      </div>

      {/* Right: sidebar width control + profile */}
      <div className="flex items-center gap-2">
        {/* Sidebar width control — desktop only */}
        <div className="hidden md:flex items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-lg px-1 py-1">
          <button
            onClick={() => handleWidthChange(-20)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
            title="Narrow sidebar"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] text-gray-400 font-medium px-1.5 tabular-nums">
            {sidebarWidth}px
          </span>
          <button
            onClick={() => handleWidthChange(20)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
            title="Widen sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
          >
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-white">
                {initials}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
              {username ?? "..."}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {username}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {isAdmin
                    ? "Administrator"
                    : isChief
                      ? "Chief Editor"
                      : "Member"}
                </p>
              </div>

              {/* Nav items */}
              <Link
                href="/dashboard"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <LayoutDashboard size={15} className="text-gray-400" />
                Dashboard
              </Link>

              <Link
                href="/myrecipe"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <BookOpen size={15} className="text-gray-400" />
                My Recipes
              </Link>

              {/* Admin link */}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <Link
                    href="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    <Shield size={15} className="text-violet-400" />
                    Admin Panel
                  </Link>
                </>
              )}

              {/* Chief link */}
              {isChief && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <Link
                    href="/chief-panel"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <ChefHat size={15} className="text-indigo-400" />
                    Chief Panel
                  </Link>
                </>
              )}

              <div className="border-t border-gray-100 my-1" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="text-red-400" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeaderNavbar;
