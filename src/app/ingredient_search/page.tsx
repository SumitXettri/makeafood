"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, ChefHat, Sparkles } from "lucide-react";
import HistorySidebar from "@/components/HistorySidebar";
import HeaderNavbar from "@/components/HeaderNavbar";
import RecipeDisplayCard from "@/components/RecipeDisplayCard";
import BottomInputBar from "@/components/BottomInputBar";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabaseClient";

// --- TYPE DEFINITIONS ---
interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: string;
  servings?: string;
  difficulty?: string;
  youtube_link?: string;
}

interface ChatMessage {
  type: "user" | "ai";
  content: string;
}

// --- MAIN COMPONENT: RecipeGenerator (State Manager) ---
export default function RecipeGenerator() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [userId, setUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const sidebarRefreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setIsChecking(false);
        return;
      }

      setUserId(user.id);
      setIsLoggedIn(true);
      setIsChecking(false);
    };
    getUser();
  }, [router]);

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    if (ingredients.length < 10) {
      setIngredients([...ingredients, ""]);
    }
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleNewRecipe = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIngredients([""]);
    setRecipe(null);
    setChatHistory([]);
    setSidebarOpen(false);
  };

  const handleGenerate = async () => {
    if (loading) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const validIngredients = ingredients.filter((ing) => ing.trim() !== "");
    if (validIngredients.length === 0) return;

    setChatHistory((prev) => [
      ...prev,
      {
        type: "user",
        content: `Generate a recipe using: ${validIngredients.join(", ")}`,
      },
    ]);

    setLoading(true);
    setRecipe(null);

    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: validIngredients, userId }), // ← send userId
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRecipe(data.recipe);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content: `Here's your recipe for "${data.recipe.title}"! It serves ${data.recipe.servings || "a few"} and takes about ${data.recipe.prep_time || "some time"} to prep.`,
        },
      ]);

      console.log("🚀 Generating recipe, userId:", userId);
      console.log("📤 Sending ingredients:", validIngredients);

      // ✅ Trigger sidebar to refresh
      sidebarRefreshRef.current?.();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleSpeak = () => {
    if (!recipe) return;

    window.speechSynthesis.cancel();

    const textToSpeak = `Recipe: ${
      recipe.title
    }. Ingredients: ${recipe.ingredients.join(
      ", ",
    )}. Instructions: ${recipe.instructions.join(". ")}. End of recipe.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Samantha") ||
            v.name.includes("Google") ||
            v.name.includes("Zira")),
      );
      utterance.voice =
        preferredVoice || voices.find((v) => v.lang.startsWith("en")) || null;
    };

    if (window.speechSynthesis.getVoices().length) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Show loading while checking auth status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <div className="w-12 h-12 bg-orange-50 rounded-full"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center px-6 max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <ChefHat className="text-white" size={56} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
            AI Chef Assistant
          </h2>
          <p className="text-lg text-gray-600 font-medium mb-8">
            Please log in to use the ingredient search and recipe generation
            feature.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Login or Sign Up
          </button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full font-sans bg-orange-50 overflow-hidden">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <HistorySidebar
        handleNewRecipe={handleNewRecipe}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        sidebarWidth={sidebarWidth}
        onRefresh={(fn) => {
          sidebarRefreshRef.current = fn;
        }} // ← pass refresh registrar
        onSelectSession={(session) => {
          setRecipe(session.recipe as Recipe);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-orange-50/50 h-full overflow-hidden">
        <HeaderNavbar
          toggleSidebar={toggleSidebar}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
        />

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {chatHistory.length === 0 && !loading && (
              <div className="text-center py-12 px-4">
                <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Sparkles className="text-white" size={60} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
                  AI Chef Assistant is Ready!
                </h2>
                <p className="text-lg text-gray-600 font-medium max-w-lg mx-auto">
                  Enter your ingredients in the input bar below and tap Generate
                  to discover delicious, custom-made recipes.
                </p>
              </div>
            )}

            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xl p-4 rounded-3xl shadow-lg transition-all duration-300 ${
                    msg.type === "user"
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-tl-md border border-orange-200"
                  }`}
                >
                  <p className="font-bold mb-2 text-xs flex items-center gap-2 opacity-80">
                    {msg.type === "user" ? (
                      <>
                        <User size={14} className="text-white/80" />
                        You
                      </>
                    ) : (
                      <>
                        <ChefHat size={14} className="text-orange-500" />
                        AI Chef
                      </>
                    )}
                  </p>
                  <p className="text-sm font-semibold">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-md shadow-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-700 font-bold text-sm">
                      Crafting your perfect recipe...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {recipe && (
              <RecipeDisplayCard
                recipe={recipe}
                isSpeaking={isSpeaking}
                handleSpeak={handleSpeak}
                handleStop={handleStop}
                rate={rate}
                setRate={setRate}
                pitch={pitch}
                setPitch={setPitch}
                volume={volume}
                setVolume={setVolume}
              />
            )}

            <div className="h-28 md:h-20"></div>
          </div>
        </div>

        <BottomInputBar
          ingredients={ingredients}
          loading={loading}
          handleIngredientChange={handleIngredientChange}
          addIngredient={addIngredient}
          removeIngredient={removeIngredient}
          handleGenerate={handleGenerate}
          handleKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
