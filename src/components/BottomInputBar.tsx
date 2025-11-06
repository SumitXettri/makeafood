import React from "react";
import { Plus, Send, Trash2, Utensils, X } from "lucide-react";

interface BottomInputBarProps {
  ingredients: string[];
  loading: boolean;
  handleIngredientChange: (index: number, value: string) => void;
  addIngredient: () => void;
  removeIngredient: (index: number) => void;
  handleGenerate: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function BottomInputBar({
  ingredients,
  loading,
  handleIngredientChange,
  addIngredient,
  removeIngredient,
  handleGenerate,
  handleKeyDown,
}: BottomInputBarProps) {
  // Count only non-empty ingredients
  const filledIngredients = ingredients.filter((ing) => ing.trim()).length;
  const hasIngredients = filledIngredients > 0;
  const canAddMore = ingredients.length < 10;

  // FIX: Refactored to safely clear the list by iterating backward.
  const handleClearIngredients = () => {
    // Iterate backward to avoid issues with index shifting when items are removed
    for (let i = ingredients.length - 1; i >= 0; i--) {
      removeIngredient(i);
    }
  };

  return (
    // 1. Centered, Narrower Container (Reduced outer padding to p-2)
    <div className="max-w-2xl w-full mx-auto p-2 flex-shrink-0">
      <div className="flex flex-col backdrop-blur-lg justify-center bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden">
        {/* 1. Compact Header/Status Bar: Now includes Generate Button */}
        <div className="flex items-center justify-between p-2.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-0.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md shadow-sm">
              <Utensils size={14} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-700 text-xs">
              Ingredients ({filledIngredients} / 10)
            </h3>
          </div>

          {/* Combined Action Buttons: Generate (Primary) + Utilities (Secondary) */}
          {/* Aligned to the right using the parent's justify-between */}
          <div className="flex items-center gap-2">
            {/* Primary Action: Generate Button (Made more compact and moved here) */}
            <button
              onClick={handleGenerate}
              disabled={loading || !hasIngredients}
              className="relative px-3 py-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white rounded-lg shadow-md hover:shadow-xl hover:scale-[1.005] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-extrabold text-[11px] flex items-center gap-1 overflow-hidden group"
              title="Generate a recipe based on the entered ingredients"
            >
              {loading ? (
                <>
                  {/* Smaller spinner icon */}
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>
                  <span className="relative z-10">Generating...</span>
                </>
              ) : (
                <>
                  <Send
                    size={14}
                    className="relative z-10 group-hover:translate-x-0.5 transition-transform"
                  />
                  {/* Hide text on small screens to save space */}
                  <span className="hidden sm:inline relative z-10">
                    Generate
                  </span>
                </>
              )}
            </button>

            {/* Utility Actions (Grouped) */}
            <div className="flex gap-1">
              {/* Clear Button */}
              {hasIngredients && (
                <button
                  onClick={handleClearIngredients}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear all ingredients"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Add Button */}
              {canAddMore && (
                <button
                  onClick={addIngredient}
                  className="p-1 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                  title="Add another ingredient"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Ingredient Pills Area (Remains the same, now visually cleaner without the bottom button bar) */}
        <div className="flex flex-wrap content-start gap-1 p-2.5 min-h-[3rem] max-h-32 overflow-y-auto scrollbar-hide">
          {/* Custom style for scrollbar hiding in this specific container */}
          <style jsx global>
            {`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none; /* IE and Edge */
                scrollbar-width: none; /* Firefox */
              }
            `}
          </style>
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="group relative flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-orange-400 focus-within:shadow-md transition-all duration-200"
            >
              <input
                type="text"
                placeholder={
                  index === 0
                    ? "e.g., chicken, rice, cheese..."
                    : `Ingredient ${index + 1}`
                }
                // Reduced width and vertical padding for maximum compactness
                className="px-2.5 py-1 bg-transparent text-sm font-medium focus:outline-none w-20 sm:w-32 text-gray-800 placeholder:text-gray-400 rounded-l-lg"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                onKeyDown={handleKeyDown}
                // Focus the latest added input
                autoFocus={
                  index === ingredients.length - 1 && ingredients.length > 1
                }
              />

              {/* Show remove button if there's more than one ingredient, OR if it's the only one and it has text */}
              {(ingredients.length > 1 || ingredient.trim() !== "") && (
                <button
                  onClick={() => removeIngredient(index)}
                  className="mr-0.5 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                  title="Remove ingredient"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}

          {/* Add ingredient placeholder button for a clean UI */}
          {/* Only show if the last input is filled and we can add more */}
          {ingredients[ingredients.length - 1]?.trim() !== "" && canAddMore && (
            <button
              onClick={addIngredient}
              className="px-2 py-1 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-orange-400 transition-all duration-200 text-sm font-medium flex items-center gap-1"
              title="Add a new ingredient field"
            >
              <Plus size={12} />
              <span className="hidden sm:inline">Add next ingredient</span>
            </button>
          )}
        </div>

        {/* Removed Section 3 (Generate Button) as it is now in the header */}
      </div>
      {/* 4. Footer Text (Tighter margin, smallest text size) */}
      <div className="mt-1 text-center text-[10px] text-gray-500">
        <p>
          What&#39;s in your kitchen! List a few core ingredients to start the
          magic.
        </p>
      </div>
    </div>
  );
}

export default BottomInputBar;
