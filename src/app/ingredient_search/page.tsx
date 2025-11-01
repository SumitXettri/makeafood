"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Send,
  Volume2,
  Square,
  Settings,
  User,
  ChefHat,
  Clock,
  Users,
  Sparkles,
  History,
  Youtube,
  Bookmark,
  Share2,
  BookOpen,
  Utensils,
} from "lucide-react";

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: string;
  servings?: string;
  difficulty?: string;
  youtube_link?: string;
}

export default function RecipeGenerator() {
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ type: "user" | "ai"; content: string }>
  >([]);

  // Update ingredient
  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  // Add ingredient
  const addIngredient = () => {
    if (ingredients.length < 10) {
      setIngredients([...ingredients, ""]);
    }
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Generate recipe
  const handleGenerate = async () => {
    const validIngredients = ingredients.filter((ing) => ing.trim() !== "");
    if (validIngredients.length === 0) return;

    // Add user message to chat
    setChatHistory((prev) => [
      ...prev,
      {
        type: "user",
        content: validIngredients.join(", "),
      },
    ]);

    setLoading(true);
    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: validIngredients }),
      });
      const data = await response.json();

      // Generate YouTube search link
      const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        data.title + " recipe"
      )}`;

      setRecipe({
        ...data,
        youtube_link: youtubeLink,
      });

      // Add AI response to chat
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content: data.title,
        },
      ]);
    } catch (err) {
      console.error("Error generating recipe:", err);
    } finally {
      setLoading(false);
    }
  };

  // Press Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Speak recipe
  const handleSpeak = () => {
    if (!recipe || isSpeaking) return;
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
      const femaleVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("jenny") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("female")
      );
      utterance.voice =
        femaleVoice || voices.find((v) => v.lang.startsWith("en")) || null;
    };

    if (window.speechSynthesis.getVoices().length) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Load voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  // New recipe reset
  const handleNewRecipe = () => {
    setIngredients([""]);
    setRecipe(null);
    setChatHistory([]);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-orange-200 flex flex-col shadow-xl">
        {/* Logo / Title */}
        <div className="p-6 border-b border-orange-200 bg-gradient-to-r from-orange-500 to-red-500">
          <div className="flex items-center gap-3">
            <ChefHat className="text-white" size={32} />
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              MakeAfood
            </h2>
          </div>
          <p className="text-white/90 text-sm mt-1">AI Recipe Generator</p>
        </div>

        {/* New Recipe Button */}
        <div className="p-4 border-b border-orange-100">
          <button
            onClick={handleNewRecipe}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            New Recipe
          </button>
        </div>

        {/* Ingredients Input Section */}
        <div className="p-4 border-b border-orange-100">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Utensils size={18} className="text-orange-500" />
            Your Ingredients
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Ingredient ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  value={ingredient}
                  onChange={(e) =>
                    handleIngredientChange(index, e.target.value)
                  }
                />
                {ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {ingredients.length < 10 && (
            <button
              onClick={addIngredient}
              className="w-full mt-2 py-2 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium flex items-center justify-center gap-1"
            >
              <Plus size={16} />
              Add Ingredient
            </button>
          )}
        </div>

        {/* History Section */}
        <div className="flex-1 p-4 overflow-y-auto text-sm">
          <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <History size={18} className="text-orange-500" />
            Recent Recipes
          </h3>
          <div className="space-y-2">
            {chatHistory
              .filter((msg) => msg.type === "ai")
              .slice(-5)
              .map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-100"
                >
                  <p className="text-gray-800 font-medium text-xs line-clamp-2">
                    {item.content}
                  </p>
                </div>
              ))}
            {chatHistory.filter((msg) => msg.type === "ai").length === 0 && (
              <p className="text-gray-500 text-xs italic">No history yet</p>
            )}
          </div>
        </div>
      </div>
      {/* MIDDLE PANEL - Chat UI */}
      <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-white border-b border-orange-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Sparkles className="text-orange-500" size={24} />
            <h1 className="text-xl font-bold text-gray-800">
              Recipe Generation
            </h1>
          </div>
        </div>

        {/* Chat Messages */}
        {/* MAIN PANEL - Chat + Recipe */}
        <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
          {/* Chat + Recipe Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Chat Section */}
              <div className="space-y-4">
                {chatHistory.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <ChefHat
                      className="mx-auto text-orange-300 mb-4"
                      size={64}
                    />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Welcome to AI Recipe Generator!
                    </h2>
                    <p className="text-gray-600">
                      Add your ingredients and let AI create amazing recipes for
                      you
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
                      className={`max-w-xl p-4 rounded-2xl shadow-md ${
                        msg.type === "user"
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-none"
                          : "bg-white border border-orange-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="font-medium mb-1 text-sm">
                        {msg.type === "user" ? "👤 You" : "🤖 AI Chef"}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-orange-200 p-4 rounded-2xl rounded-bl-none shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200"></div>
                        <span className="ml-2 text-gray-600">
                          Cooking up something delicious...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipe Section */}
              {recipe && (
                <div className="space-y-6 bg-white border border-orange-200 rounded-2xl shadow-lg p-6">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
                  </div>

                  {/* YouTube + Actions */}
                  <div className="flex flex-wrap gap-2">
                    {recipe.youtube_link && (
                      <a
                        href={recipe.youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        <Youtube size={16} />
                        Watch Video
                      </a>
                    )}
                    <button className="px-4 py-2 bg-white border border-orange-200 hover:bg-orange-50 rounded-lg flex items-center gap-2 text-sm">
                      <Bookmark size={16} className="text-orange-500" />
                      Save
                    </button>
                  </div>

                  {/* Voice Buttons */}
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleSpeak}
                      disabled={isSpeaking}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center hover:shadow-lg transition"
                    >
                      <Volume2 size={20} />
                    </button>
                    <button
                      onClick={handleStop}
                      className="w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center hover:shadow-lg transition"
                    >
                      <Square size={20} />
                    </button>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
                      <Utensils className="text-orange-500" size={20} />
                      Ingredients
                    </h3>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ing, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
                      <BookOpen className="text-orange-500" size={20} />
                      Instructions
                    </h3>
                    <ol className="space-y-3">
                      {recipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 flex-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-orange-200 p-4 bg-white shadow-lg">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                placeholder="Type ingredients..."
                className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 transition"
                value={ingredients[0]}
                onChange={(e) => handleIngredientChange(0, e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || ingredients.every((ing) => !ing.trim())}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-semibold flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
