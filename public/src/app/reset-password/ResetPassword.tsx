"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

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

export default function ResetPassword() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  interface FloatingFood {
    emoji: string;
    left: number;
    top: number;
    size: number;
    delay: number;
    duration: number;
  }
  const [floatingFoods, setFloatingFoods] = useState<FloatingFood[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Food emojis for background decoration

  useEffect(() => {
    const foods = Array.from({ length: 30 }, () => ({
      emoji: foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 3.5,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 15,
    }));

    setFloatingFoods(foods);
  }, [foodEmojis]);

  async function handleReset() {
    if (!token) {
      setMessage({ type: "error", text: "Invalid or missing reset token" });
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setLoading(true);
    setMessage(null);

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
      setMessage({
        type: "error",
        text: data.error || "Reset failed. Please try again.",
      });
    } else {
      setMessage({
        type: "success",
        text: "Password reset successful! Please log in with your new password.",
      });
      setTimeout(() => {
        window.location.href = "/?auth=login";
      }, 2000);
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
        @keyframes slideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Toast Message */}
      {message && (
        <div className="fixed top-4 right-4 z-50 animate-[slideIn_0.3s_ease-out]">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
              message.type === "success"
                ? "bg-green-50 border-2 border-green-200"
                : "bg-red-50 border-2 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="text-green-600" size={24} />
            ) : (
              <XCircle className="text-red-600" size={24} />
            )}
            <p
              className={`font-medium ${
                message.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Back Navigation */}
        <Link
          href="/?auth=login"
          className="flex items-center gap-2 text-orange-700 hover:text-orange-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Home</span>
        </Link>

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
              <Link
                href="/?auth=login"
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
