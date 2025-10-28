"use client";
import { useState, useEffect } from "react";

export default function RecipeGenerator() {
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Update ingredient (only one input now)
  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  // Add ingredient (optional, but we’ll keep it simple)
  const addIngredient = () => {
    if (ingredients.length < 5) {
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

    setLoading(true);
    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: validIngredients }),
      });
      const data = await response.json();
      setRecipe(data);
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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo / Title */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-extrabold text-blue-700 tracking-tight">
            MakeAfood
          </h2>
        </div>

        {/* New Recipe Button */}
        <div className="p-4 border-b">
          <button
            onClick={() => {
              setIngredients([""]);
              setRecipe(null);
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            + New Recipe
          </button>
        </div>

        {/* History Section */}
        <div className="flex-1 p-4 overflow-y-auto text-sm">
          <h3 className="font-semibold mb-3 text-gray-700">History</h3>
          <ul className="space-y-1">
            {["🍝 Pasta", "🥗 Salad", "🍛 Curry"].map((item, index) => (
              <li
                key={index}
                className="p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* MIDDLE PANEL - Chat UI */}
      <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* User Message */}
          {ingredients[0] && !loading && !recipe && (
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg max-w-3xl mx-auto rounded-br-none">
              <strong>You:</strong> {ingredients.filter(Boolean).join(", ")}
            </div>
          )}

          {/* AI Thinking */}
          {loading && (
            <div className="bg-gray-100 p-4 rounded-lg max-w-3xl mx-auto animate-pulse">
              🤖 Generating your recipe...
            </div>
          )}

          {/* AI Response Preview */}
          {recipe && (
            <div className="bg-gray-100 p-6 rounded-lg max-w-3xl mx-auto shadow-sm">
              <h3 className="text-xl font-bold mb-2">{recipe.title}</h3>
              <p className="text-gray-700 mb-2">
                Full details are in the right panel.
              </p>
              <button
                onClick={handleSpeak}
                className="text-sm underline hover:text-blue-600"
              >
                🔊 Listen Summary
              </button>
            </div>
          )}
        </div>

        {/* Input at Bottom */}
        <div className="border-t p-4 bg-white">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Enter ingredients: chicken, rice..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={ingredients[0]}
              onChange={(e) => handleIngredientChange(0, e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Recipe Output */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Top Nav */}
        <div className="flex justify-end items-center gap-6 p-3 border-b bg-white">
          <button className="text-gray-600 cursor-pointer hover:text-gray-800">
            ⚙️
          </button>
          <button
            onClick={() => setShowVoiceSettings((prev) => !prev)}
            className="text-gray-600 cursor-pointer hover:text-gray-800"
            aria-label="Toggle voice settings"
          >
            ⋮
          </button>
          <div className="w-8 h-8 cursor-pointer bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            P
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!recipe && (
            <p className="text-gray-500">Your recipe will appear here</p>
          )}

          {recipe && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {recipe.title}
              </h2>
              {showVoiceSettings && (
                <p className="text-xs text-gray-500 mt-1">
                  Adjust voice playback
                </p>
              )}

              {/* Voice Settings - Toggle with Smooth Animation */}
              <div className="flex justify-center gap-4 mb-5">
                <button
                  onClick={handleSpeak}
                  disabled={isSpeaking || !recipe}
                  title="Listen to recipe"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none"
                >
                  <span className="text-xl">{isSpeaking ? "⏸️" : "▶️"}</span>
                </button>

                <button
                  onClick={handleStop}
                  title="Stop"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <span className="text-xl">⏹️</span>
                </button>
              </div>

              {/* Voice Settings Panel */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  showVoiceSettings
                    ? "max-h-[600px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="bg-white/70 backdrop-blur-sm border border-blue-200 rounded-2xl p-5 shadow-lg">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🎙️ Voice Settings
                  </h3>

                  <div className="space-y-5">
                    {/* Speed */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>Speed</span>
                        <span>{rate.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 h-2 rounded-full"
                      />
                    </div>

                    {/* Pitch */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>Pitch</span>
                        <span>{pitch.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 h-2 rounded-full"
                      />
                    </div>

                    {/* Volume */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>Volume</span>
                        <span>{Math.round(volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-green-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invisible placeholder for smooth collapse */}
              <div
                className={!showVoiceSettings ? "animate-slide-up" : ""}
                style={
                  !showVoiceSettings
                    ? {
                        maxHeight: 500,
                        overflow: "hidden",
                        padding: "0 1rem",
                      }
                    : {}
                }
              />

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-bold">🛒 Ingredients</h3>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {recipe?.ingredients?.map((ing: string, i: number) => (
                    <li key={i}>{ing}</li>
                  )) || <li>No ingredients available</li>}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-bold">📝 Instructions</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  {recipe?.instructions?.map((step: string, i: number) => (
                    <li key={i} className="text-gray-700">
                      {step}
                    </li>
                  )) || <li>No instructions available</li>}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 text-xs text-gray-600">
          MakeAfood © 2025
        </div>
      </div>
    </div>
  );
}
