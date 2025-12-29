"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Food emojis for background decoration
  const foodEmojis = [
    "🍕",
    "🍔",
    "🍟",
    "🌮",
    "🍱",
    "🍜",
    "🍝",
    "🥗",
    "🍣",
    "🥘",
    "🍲",
    "🥙",
    "🌯",
    "🥪",
    "🍞",
    "🥐",
    "🥖",
    "🧇",
    "🥞",
    "🍳",
    "🥓",
    "🍗",
    "🍖",
    "🌭",
    "🍿",
    "🧆",
    "🥟",
    "🍤",
    "🦞",
    "🍛",
    "🥩",
    "🦴",
    "🍕",
    "🫓",
    "🥨",
    "🥯",
    "🥖",
    "🍱",
    "🍘",
    "🍙",
    "🍚",
    "🍛",
    "🍜",
    "🍝",
    "🍠",
    "🍢",
    "🍣",
    "🍤",
    "🍥",
    "🥮",
    "🍡",
    "🥠",
    "🥡",
    "🦀",
    "🦐",
    "🦑",
    "🦪",
    "🧋",
    "🍰",
    "🎂",
    "🧁",
    "🥧",
    "🍮",
    "🍭",
    "🍬",
    "🍫",
    "🍿",
    "🍩",
    "🍪",
    "🌰",
    "🥜",
    "🍯",
    "🥛",
    "🍼",
    "☕",
    "🫖",
    "🧃",
    "🥤",
    "🧉",
    "🍵",
    "🍶",
    "🍾",
    "🍷",
    "🍺",
    "🍻",
    "🥂",
    "🥃",
    "🧊",
    "🥄",
    "🍴",
  ];

  const [floatingFoods] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      emoji: foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 3.5,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 15,
    }))
  );

  async function handleReset() {
    if (!token) {
      alert("Invalid or missing reset token");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Reset failed");
    } else {
      alert("Password reset successful");
    }
  }

  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Food Background */}
      {floatingFoods.map((food, i) => (
        <div
          key={i}
          className="absolute opacity-20 pointer-events-none"
          style={{
            left: `${food.left}%`,
            top: `${food.top}%`,
            fontSize: `${food.size}rem`,
            animation: `float ${food.duration}s ease-in-out ${food.delay}s infinite`,
          }}
        >
          {food.emoji}
        </div>
      ))}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">
        {/* Back Navigation */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-orange-700 hover:text-orange-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <Link href="/">
            {" "}
            <span className="font-medium">Back to Home</span>
          </Link>
        </button>

        {/* Card */}
        <div className="bg-orange-50 rounded-2xl shadow-xl p-8 border border-orange-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full mb-4 shadow-lg">
              <Lock className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${
                    confirmPassword === ""
                      ? "border-gray-200 focus:border-orange-400"
                      : passwordsMatch
                      ? "border-green-400 focus:border-green-500"
                      : "border-red-400 focus:border-red-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {confirmPassword !== "" && (
                <p
                  className={`text-xs mt-1 ${
                    passwordsMatch ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {passwordsMatch
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleReset}
              disabled={loading || !passwordsMatch || password.length < 6}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <a
                href="/login"
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
