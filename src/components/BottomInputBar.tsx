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
  const filledIngredients = ingredients.filter((ing: string) =>
    ing.trim()
  ).length;
  const hasIngredients = filledIngredients > 0;
  const canAddMore = ingredients.length < 10;

  const handleClearIngredients = () => {
    for (let i = ingredients.length - 1; i >= 0; i--) {
      removeIngredient(i);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-2 flex-shrink-0">
      <div className="flex flex-col backdrop-blur-lg justify-center bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-2.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-0.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md shadow-sm">
              <Utensils size={14} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-700 text-xs">
              Ingredients ({filledIngredients} / 10)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading || !hasIngredients}
              className="relative px-3 py-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white rounded-lg shadow-md hover:shadow-xl hover:scale-[1.005] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-extrabold text-[11px] flex items-center gap-1 overflow-hidden group"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>
                  <span className="relative z-10">Generating...</span>
                </>
              ) : (
                <>
                  <Send
                    size={14}
                    className="relative z-10 group-hover:translate-x-0.5 transition-transform"
                  />
                  <span className="hidden sm:inline relative z-10">
                    Generate
                  </span>
                </>
              )}
            </button>

            <div className="flex gap-1">
              {hasIngredients && (
                <button
                  onClick={handleClearIngredients}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear all ingredients"
                >
                  <Trash2 size={16} />
                </button>
              )}
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

        <div className="flex flex-wrap content-start gap-1 p-2.5 min-h-[3rem] max-h-32 overflow-y-auto">
          {ingredients.map((ingredient: string, index: number) => (
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
                className="px-2.5 py-1 bg-transparent text-sm font-medium focus:outline-none w-20 sm:w-32 text-gray-800 placeholder:text-gray-400 rounded-l-lg"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={
                  index === ingredients.length - 1 && ingredients.length > 1
                }
              />
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
      </div>
      <div className="mt-1 text-center text-[10px] text-gray-500">
        <p>
          What&apos;s in your kitchen! List a few core ingredients to start the
          magic.
        </p>
      </div>
    </div>
  );
}

export default BottomInputBar;
