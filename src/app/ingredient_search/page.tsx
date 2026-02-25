"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, ChefHat, Sparkles, Clock, ChevronRight } from "lucide-react";
import HistorySidebar from "@/components/HistorySidebar";
import HeaderNavbar from "@/components/HeaderNavbar";
import RecipePanel from "@/components/RecipeDisplayCard";
import BottomInputBar from "@/components/BottomInputBar";
import { supabase } from "@/lib/supabaseClient";
import IsLoggedIn from "@/components/IsLoggedIn";
import AuthModal from "@/components/AuthModal";

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
  recipe?: Recipe;
}

// --- MAIN COMPONENT ---
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const sidebarRefreshRef = useRef<(() => void) | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleIngredientChange = (index: number, value: string) => {
    const n = [...ingredients];
    n[index] = value;
    setIngredients(n);
  };
  const addIngredient = () => {
    if (ingredients.length < 10) setIngredients([...ingredients, ""]);
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
    setPanelOpen(false);
    setActiveRecipe(null);
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
        body: JSON.stringify({ ingredients: validIngredients, userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRecipe(data.recipe);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content: `Here's your recipe for "${data.recipe.title}"!`,
          recipe: data.recipe,
        },
      ]);
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
    if (!activeRecipe) return;
    window.speechSynthesis.cancel();
    const textToSpeak = `Recipe: ${activeRecipe.title}. Ingredients: ${activeRecipe.ingredients.join(", ")}. Instructions: ${activeRecipe.instructions.join(". ")}. End of recipe.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Samantha") ||
            v.name.includes("Google") ||
            v.name.includes("Zira")),
      );
      utterance.voice =
        preferred || voices.find((v) => v.lang.startsWith("en")) || null;
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
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const openPanel = (r: Recipe) => {
    setActiveRecipe(r);
    setPanelOpen(true);
  };
  const closePanel = () => {
    setPanelOpen(false);
    handleStop();
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Loading
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-orange-200 shadow-md animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <>
        <IsLoggedIn setShowAuthModal={setShowAuthModal} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <div
      className="flex h-screen w-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-orange-900/20 z-20 md:hidden backdrop-blur-sm"
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
        }}
        onSelectSession={(session) => {
          const r = session.recipe as Recipe;
          setRecipe(r);
          openPanel(r);
        }}
      />
      {/* Main content area */}

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        <HeaderNavbar
          toggleSidebar={toggleSidebar}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
        />

        {/* Chat + Panel wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat column */}
          <div
            className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${panelOpen ? "md:max-w-[50%]" : "w-full"}`}
          >
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Empty state */}
                {chatHistory.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="px-4 py-3 bg-white border border-orange-100 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="text-orange-400" size={28} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 tracking-tight">
                      What's in your fridge?
                    </h2>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                      Add your ingredients below and I'll craft a personalized
                      recipe just for you.
                    </p>
                  </div>
                )}

                {/* Chat messages */}
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* AI avatar */}
                    {msg.type === "ai" && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mt-0.5">
                        <ChefHat size={14} className="text-orange-400" />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 max-w-sm">
                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.type === "user"
                            ? "bg-gray-900 text-white rounded-tr-sm"
                            : "bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Recipe chip — shown only on AI messages that have a recipe */}
                      {msg.type === "ai" && msg.recipe && (
                        <button
                          onClick={() => openPanel(msg.recipe!)}
                          className="group flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 text-left w-full"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                            <ChefHat size={16} className="text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {msg.recipe.title}
                            </p>
                            {msg.recipe.prep_time && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {msg.recipe.prep_time}
                              </p>
                            )}
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0"
                          />
                        </button>
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.type === "user" && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center mt-0.5">
                        <User size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                      <ChefHat size={14} className="text-orange-400" />
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                          style={{ animationDelay: `${delay}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} className="h-4" />
              </div>
            </div>

            {/* Input bar */}
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

          {/* Recipe panel — slides in from right like Claude artifacts */}
          <div
            className={`
            hidden md:flex flex-col
            border-l border-orange-100 bg-white/80 backdrop-blur-sm
            transition-all duration-300 ease-in-out overflow-hidden
            ${panelOpen ? "w-[50%] opacity-100" : "w-0 opacity-0"}
          `}
          >
            {panelOpen && activeRecipe && (
              <RecipePanel
                recipe={activeRecipe}
                isSpeaking={isSpeaking}
                handleSpeak={handleSpeak}
                handleStop={handleStop}
                rate={rate}
                setRate={setRate}
                pitch={pitch}
                setPitch={setPitch}
                volume={volume}
                setVolume={setVolume}
                onClose={closePanel}
              />
            )}
          </div>
        </div>
      </div>
      {/* Mobile: full-screen panel overlay */}
      {panelOpen && activeRecipe && (
        <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col">
          <RecipePanel
            recipe={activeRecipe}
            isSpeaking={isSpeaking}
            handleSpeak={handleSpeak}
            handleStop={handleStop}
            rate={rate}
            setRate={setRate}
            pitch={pitch}
            setPitch={setPitch}
            volume={volume}
            setVolume={setVolume}
            onClose={closePanel}
          />
        </div>
      )}
    </div>
  );
}
