"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  FaUtensils,
  FaClock,
  FaUsers,
  FaListUl,
  FaImage,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import Image from "next/image";

export default function SubmitRecipePage() {
  const router = useRouter();

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [prepTime, setPrepTime] = useState<number | undefined>();
  const [cookTime, setCookTime] = useState<number | undefined>();
  const [servings, setServings] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Easy"
  );

  // New fields
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [tags, setTags] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (recipeId: number): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${recipeId}-${Date.now()}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: unknown) {
      console.error("Image upload error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Image upload failed: ${message}`);
      return null;
    }
  };

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  // Instruction handlers
  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    // Filter out empty ingredients and instructions
    const validIngredients = ingredients.filter((ing) => ing.trim() !== "");
    const validInstructions = instructions.filter((inst) => inst.trim() !== "");

    if (validIngredients.length === 0) {
      setError("Please add at least one ingredient.");
      return;
    }

    if (validInstructions.length === 0) {
      setError("Please add at least one instruction step.");
      return;
    }

    setLoading(true);
    setUploadProgress(20);

    // Check if recipe exists
    const { data: existing, error: checkError } = await supabase
      .from("recipes")
      .select("id, title")
      .ilike("title", `%${title.trim()}%`);

    if (checkError) {
      setError(checkError.message);
      setLoading(false);
      return;
    }

    if (existing && existing.length > 0) {
      setError(
        `A recipe with a similar title already exists: "${existing[0].title}".`
      );
      setLoading(false);
      return;
    }

    setUploadProgress(40);

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("You must be logged in to submit a recipe.");
      setLoading(false);
      return;
    }

    setUploadProgress(60);

    // Prepare tags array
    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    // Prepare ingredients as simple JSONB array
    const ingredientsJsonb = validIngredients.map((ing) => ing.trim());

    // Prepare instructions as simple JSONB array
    const instructionsJsonb = validInstructions.map((inst) => inst.trim());

    

    // Insert recipe with JSONB formatted data
    const { data: recipeData, error: insertError } = await supabase
      .from("recipes")
      .insert([
        {
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          prep_time_minutes: prepTime || null,
          cook_time_minutes: cookTime || null,
          servings: servings || null,
          difficulty_level: difficulty,
          cuisine: cuisine.trim() || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          ingredients: ingredientsJsonb, // JSONB format
          instructions: instructionsJsonb, // JSONB format
          is_public: true,
          is_approved: false, // Requires approval
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setUploadProgress(80);

    // Upload image if provided
    if (imageFile && recipeData) {
      const imageUrl = await uploadImage(recipeData.id);

      if (imageUrl) {
        // Update recipe with image URL
        const { error: updateError } = await supabase
          .from("recipes")
          .update({ image_url: imageUrl })
          .eq("id", recipeData.id);

        if (updateError) {
          console.error("Failed to update image URL:", updateError);
        }
      }
    }

    setUploadProgress(100);
    setLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <FaUtensils className="text-orange-600" />
            Submit Recipe
          </h1>
          <p className="text-gray-600 text-sm">
            Share your delicious recipe with the community
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recipe Image
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview || ""}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded-lg"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <FaImage className="text-gray-400 text-3xl" />
                  </div>
                )}
                <label className="cursor-pointer bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  Choose Image
                </label>
                <span className="text-sm text-gray-500">Max 5MB</span>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Basic Information
              </h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <div className="relative">
                  <MdOutlineRestaurantMenu className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="e.g. Spicy Chicken Curry"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="Brief description of your recipe..."
                />
              </div>

              {/* Cuisine & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                 
                  <select
            value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">Select cuisine type</option>
            <option value="Nepali">Nepali Cuisine</option>
            <option value="Italian">Italian Cuisine</option>
            <option value="Chinese">Chinese Cuisine</option>
            <option value="Indian">Indian Cuisine</option>
            <option value="Mexican">Mexican Cuisine</option>
            <option value="French">French Cuisine</option>
            <option value="Japanese">Japanese Cuisine</option>
            <option value="Thai">Thai Cuisine</option>
            <option value="Mediterranean">Mediterranean Cuisine</option>
            <option value="American">American Cuisine</option>
            <option value="Baking">Baking & Pastry</option>
            <option value="Desserts">Desserts</option>
            <option value="Vegan">Vegan Cuisine</option>
            <option value="Other">Other</option>
          </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="e.g. spicy, vegetarian, quick"
                  />
                </div>
              </div>

              {/* Time & Servings Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (min)
                  </label>
                  <div className="relative">
                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="15"
                      value={prepTime || ""}
                      onChange={(e) => setPrepTime(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cook Time (min)
                  </label>
                  <div className="relative">
                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="30"
                      value={cookTime || ""}
                      onChange={(e) => setCookTime(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servings
                  </label>
                  <div className="relative">
                    <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="4"
                      value={servings || ""}
                      onChange={(e) => setServings(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="relative">
                  <FaListUl className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(
                        e.target.value as "Easy" | "Medium" | "Hard"
                      )
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition appearance-none bg-white cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Ingredients *
              </h2>
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
              >
                <FaPlus /> Add Ingredient
              </button>
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Instructions *
              </h2>
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-10 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    placeholder={`Step ${index + 1}`}
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition self-start"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addInstruction}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
              >
                <FaPlus /> Add Step
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Progress Bar */}
            {loading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Recipe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
