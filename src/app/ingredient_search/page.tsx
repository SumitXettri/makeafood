"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  ChefHat,
  Sparkles,
  // Search is imported but unused in the original logic, keeping for future use
} from "lucide-react";

import HeaderNavbar from "../../components/HeaderNavbar";
import RecipeDisplayCard from "../../components/RecipeDisplayCard";
import HistorySidebar from "../../components/HistorySidebar";
import BottomInputBar from "../../components/BottomInputBar";

interface Recipe {
  title: string;
  ingredients: string[]; // Mock uses string array for simplicity
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

// --- MOCK API (To be replaced with real Gemini API call) ---
const mockGenerateRecipe = async (ingredients: string[]): Promise<Recipe> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const ingredientList = ingredients.map((i) => i.toLowerCase().trim());
  const keyIngredients = ingredientList.slice(0, 3).join(", ");
  const baseTitle = keyIngredients
    .split(", ")
    .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
    .join(" & ");

  return {
    title: `${baseTitle} Stir-Fry with Spicy Peanut Sauce`,
    ingredients: [
      `300g Chicken Breast or Tofu`,
      `2 tbsp Peanut Butter`,
      `1 tbsp Soy Sauce (or Tamari)`,
      `1 tsp Honey or Maple Syrup`,
      `1/2 tsp Sriracha (or to taste)`,
      `1 cup Mixed Vegetables (e.g., bell pepper, broccoli)`,
      `1 cup Cooked Rice or Noodles`,
      `1/4 cup Chopped Peanuts`,
    ],
    instructions: [
      "Prepare the peanut sauce by whisking together peanut butter, soy sauce, honey, sriracha, and 3 tbsp of hot water until smooth.",
      "Chop the chicken or tofu and mixed vegetables into bite-sized pieces.",
      "Heat oil in a wok or large pan. Stir-fry the protein until cooked through (about 5-7 minutes).",
      "Add the mixed vegetables and stir-fry for 3 minutes until tender-crisp.",
      "Pour the peanut sauce over the mixture and toss until everything is well-coated and heated through.",
      "Serve immediately over rice or noodles and garnish with chopped peanuts.",
    ],
    prep_time: "20 minutes",
    servings: "2 servings",
    difficulty: "Medium",
    youtube_link: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${baseTitle} stir fry recipe`
    )}`,
  };
};

// --- MAIN COMPONENT: RecipeGenerator (State Manager) ---
export default function RecipeGenerator() {
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  // Voice Synthesis States (now managed here)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  // Chat/History States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // --- Utility Handlers ---

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
    // setSearchQuery is no longer used, removed it.
  };

  // --- Main Logic ---

  const handleGenerate = async () => {
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
      const data = await mockGenerateRecipe(validIngredients);

      setRecipe(data);

      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content: `Found it! Try: ${data.title}`,
        },
      ]);
    } catch (err) {
      console.error("Error generating recipe:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content:
            "Sorry, I couldn't generate a recipe right now. Please try again!",
        },
      ]);
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

  // --- Speech Synthesis Handlers ---
  const handleSpeak = () => {
    if (!recipe) return;

    window.speechSynthesis.cancel();

    const textToSpeak = `Recipe: ${
      recipe.title
    }. Ingredients: ${recipe.ingredients.join(
      ", "
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
            v.name.includes("Zira"))
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

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Main Render ---
  return (
    <div className="flex h-screen w-full font-sans bg-orange-50">
      {/* 1. Left Sidebar (History Panel) */}
      <HistorySidebar
        chatHistory={chatHistory}
        handleNewRecipe={handleNewRecipe}
      />

      {/* 2. Right Panel (Main Content & Input Bar) */}
      <div className="flex-1 flex flex-col bg-orange-50/50 h-full overflow-hidden">
        {/* TOP NAVBAR */}
        <HeaderNavbar />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Welcome State */}
            {chatHistory.length === 0 && !loading && (
              <div className="text-center py-12 px-4">
                <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Sparkles className="text-white" size={60} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
                  AI Chef Assistant is Ready!
                </h2>
                <p className="text-lg text-gray-600 font-medium max-w-lg mx-auto">
                  Enter your ingredients in the input bar below and tap
                  **Generate** to discover delicious, custom-made recipes.
                </p>
              </div>
            )}

            {/* Chat Messages */}
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

            {/* Loading State */}
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

            {/* Recipe Card Display */}
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

            {/* Spacer to ensure content doesn't get hidden behind the fixed input bar */}
            <div className="h-28 md:h-20"></div>
          </div>
        </div>

        {/* FIXED BOTTOM INPUT BAR */}
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
