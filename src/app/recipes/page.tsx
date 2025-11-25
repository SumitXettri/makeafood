"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RecipeList from "@/components/RecipeList";
import Navbar from "@/components/Navbar";

function RecipesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🧠 Read search params
  const selectedCuisine = searchParams.get("cuisine") || "";
  const selectedDifficulty = searchParams.get("difficulty") || "";
  const selectedCountry = searchParams.get("country") || "";
  const selectedMealType = searchParams.get("mealType") || "";
  const selectedDiet = searchParams.get("diet") || "";
  const selectedTime = searchParams.get("time") || "";
  const query = searchParams.get("query") || "";

  const [searchInput, setSearchInput] = useState(query);

  // Options
  const cuisines = [
    "Italian",
    "Chinese",
    "Mexican",
    "Japanese",
    "French",
    "Thai",
    "Indian",
    "Mediterranean",
    "Korean",
    "Vietnamese",
  ];
  const difficulties = ["Easy", "Medium", "Hard"];
  const countries = [
    "Italy",
    "China",
    "Mexico",
    "Japan",
    "France",
    "Thailand",
    "India",
    "USA",
    "Spain",
    "Greece",
    "Korea",
    "Vietnam",
  ];
  const mealTypes = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snack",
    "Appetizer",
    "Dessert",
  ];
  const diets = [
    "Vegetarian",
    "Vegan",
    "Keto",
    "Paleo",
    "Gluten-Free",
    "Dairy-Free",
    "Low-Carb",
  ];

  // --- Handlers ---
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) params.set("query", searchInput.trim());
    else params.delete("query");
    router.push(`/recipes?${params.toString()}`);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "" || value === "all") params.delete(filterType);
    else params.set(filterType, value.toLowerCase());
    router.push(`/recipes?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    router.push("/recipes");
  };

  const activeFiltersCount = [
    selectedCuisine,
    selectedDifficulty,
    selectedCountry,
    selectedMealType,
    selectedDiet,
    selectedTime,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-7xl mx-auto mb-6 pt-6">
        <Navbar />
      </div>

      {/* 🧡 Filter Bar */}
      <div className="top-0 z-20 border-orange-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-orange-700">Filter</h2>
            {activeFiltersCount > 0 && (
              <span className="text-sm text-gray-600">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}{" "}
                active
              </span>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* 🔍 Search */}
            <form
              onSubmit={handleSearch}
              className="flex-1 min-w-[200px] max-w-xs"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full px-4 py-2 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                  aria-label="Search"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </form>

            {/* 🍝 Cuisine Dropdown */}
            <div className="relative">
              <select
                value={selectedCuisine}
                onChange={(e) => handleFilterChange("cuisine", e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm cursor-pointer min-w-[140px]"
              >
                <option value="">Cuisine</option>
                {cuisines.map((cuisine) => (
                  <option key={cuisine} value={cuisine.toLowerCase()}>
                    {cuisine}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* ⚙ Difficulty */}
            <div className="relative">
              <select
                value={selectedDifficulty}
                onChange={(e) =>
                  handleFilterChange("difficulty", e.target.value)
                }
                className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm cursor-pointer min-w-[140px]"
              >
                <option value="">Difficulty</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty.toLowerCase()}>
                    {difficulty}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* 🌍 Country */}
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => handleFilterChange("country", e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm cursor-pointer min-w-[140px]"
              >
                <option value="">Country</option>
                {countries.map((country) => (
                  <option key={country} value={country.toLowerCase()}>
                    {country}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* 🍽 Meal Type */}
            <div className="relative">
              <select
                value={selectedMealType}
                onChange={(e) => handleFilterChange("mealType", e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm cursor-pointer min-w-[140px]"
              >
                <option value="">Meal Type</option>
                {mealTypes.map((mealType) => (
                  <option key={mealType} value={mealType.toLowerCase()}>
                    {mealType}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* 🥦 Diet */}
            <div className="relative">
              <select
                value={selectedDiet}
                onChange={(e) => handleFilterChange("diet", e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm cursor-pointer min-w-[140px]"
              >
                <option value="">Diet</option>
                {diets.map((diet) => (
                  <option key={diet} value={diet.toLowerCase()}>
                    {diet}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* 🔘 Apply / Filter */}
            <button
              onClick={() => handleSearch()}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-all text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Apply Filters
            </button>

            {/* ❌ Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all text-sm flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recipe List - Pass all filters */}
      <div className="container mx-auto py-8">
        <RecipeList
          query={query}
          cuisine={selectedCuisine}
          difficulty={selectedDifficulty}
          country={selectedCountry}
          mealType={selectedMealType}
          diet={selectedDiet}
          time={selectedTime}
        />
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-200" />
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-orange-500 absolute top-0 left-0" />
          </div>
          <p className="text-gray-600 font-medium animate-pulse">
            Loading delicious recipes...
          </p>
        </div>
      }
    >
      <RecipesContent />
    </Suspense>
  );
}
