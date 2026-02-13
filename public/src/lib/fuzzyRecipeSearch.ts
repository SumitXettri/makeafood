// lib/fuzzyRecipeSearch.ts
// Fuzzy search algorithm for finding "closest match" recipes

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  tags?: string[];
  cuisine?: string;
  difficulty_level?: string;
  source: string;
}

interface ScoredRecipe extends Recipe {
  matchScore: number;
  matchedKeywords: string[];
  matchType: "exact" | "partial" | "fuzzy" | "ingredient" | "tag";
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for fuzzy matching when user has typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio (0-1) between two strings
 */
function similarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Extract keywords from search query
 * Removes common words and splits by space
 */
function extractKeywords(query: string): string[] {
  const commonWords = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "can",
    "could",
    "may",
    "might",
    "must",
    "with",
    "for",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "from",
    "by",
    "of",
    "recipe",
    "food",
    "dish",
    "make",
    "how",
    "what",
    "where",
    "when",
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word));
}

/**
 * Score a recipe based on how well it matches the search query
 */
function scoreRecipe(recipe: Recipe, query: string): ScoredRecipe {
  const keywords = extractKeywords(query);
  let score = 0;
  const matchedKeywords: string[] = [];
  let matchType: "exact" | "partial" | "fuzzy" | "ingredient" | "tag" = "fuzzy";

  const titleLower = recipe.title.toLowerCase();
  const descLower = recipe.description.toLowerCase();
  const queryLower = query.toLowerCase();

  // 1. EXACT MATCH in title (highest priority)
  if (titleLower.includes(queryLower)) {
    score += 100;
    matchType = "exact";
    matchedKeywords.push(query);
  }

  // 2. PARTIAL MATCH - Check each keyword
  keywords.forEach((keyword) => {
    // Title match (high score)
    if (titleLower.includes(keyword)) {
      score += 50;
      matchedKeywords.push(keyword);
      if (matchType !== "exact") matchType = "partial";
    }

    // Description match (medium score)
    if (descLower.includes(keyword)) {
      score += 20;
      matchedKeywords.push(keyword);
    }

    // Ingredient match (high score - people often search by ingredient)
    const ingredientMatch = recipe.ingredients.some((ing) =>
      ing.toLowerCase().includes(keyword)
    );
    if (ingredientMatch) {
      score += 40;
      matchedKeywords.push(keyword);
      if (matchType === "fuzzy") matchType = "ingredient";
    }

    // Tag match (medium score)
    if (recipe.tags) {
      const tagMatch = recipe.tags.some((tag) =>
        tag.toLowerCase().includes(keyword)
      );
      if (tagMatch) {
        score += 30;
        matchedKeywords.push(keyword);
        if (matchType === "fuzzy") matchType = "tag";
      }
    }

    // 3. FUZZY MATCH - Check for typos/similar words
    const titleWords = titleLower.split(/\s+/);
    titleWords.forEach((word) => {
      const similarity = similarityRatio(keyword, word);
      if (similarity > 0.7) {
        // 70% similar
        score += Math.floor(similarity * 30);
        matchedKeywords.push(`${keyword}~${word}`);
      }
    });

    // Check ingredients for fuzzy match
    recipe.ingredients.forEach((ing) => {
      const ingWords = ing.toLowerCase().split(/\s+/);
      ingWords.forEach((word) => {
        const similarity = similarityRatio(keyword, word);
        if (similarity > 0.75) {
          score += Math.floor(similarity * 25);
          matchedKeywords.push(`${keyword}~${word}`);
        }
      });
    });
  });

  // 4. BONUS SCORING
  // Boost recipes from community (they're vetted)
  if (recipe.source === "Community") {
    score += 5;
  }

  // Boost Nepali recipes if query contains nepali terms
  const nepaliTerms = [
    "nepal",
    "nepali",
    "momo",
    "dal",
    "bhat",
    "chana",
    "achar",
  ];
  if (
    nepaliTerms.some((term) => queryLower.includes(term)) &&
    recipe.source === "Nepali Collection"
  ) {
    score += 15;
  }

  // Boost if multiple keywords matched
  const uniqueMatches = new Set(matchedKeywords).size;
  if (uniqueMatches > 1) {
    score += uniqueMatches * 10;
  }

  return {
    ...recipe,
    matchScore: score,
    matchedKeywords: [...new Set(matchedKeywords)],
    matchType,
  };
}

/**
 * Main fuzzy search function
 * Returns recipes even if no exact match exists
 */
export function fuzzySearchRecipes(
  recipes: Recipe[],
  query: string,
  minScore: number = 10 // Minimum score to include in results
): ScoredRecipe[] {
  if (!query || query.trim().length === 0) {
    return recipes.map((r) => ({
      ...r,
      matchScore: 0,
      matchedKeywords: [],
      matchType: "fuzzy" as const,
    }));
  }

  // Score all recipes
  const scored = recipes
    .map((recipe) => scoreRecipe(recipe, query))
    .filter((recipe) => recipe.matchScore >= minScore);

  // Sort by score (highest first)
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored;
}

/**
 * Group recipes by match quality for better UX
 */
export function groupRecipesByMatchQuality(scoredRecipes: ScoredRecipe[]) {
  const exactMatches: ScoredRecipe[] = [];
  const partialMatches: ScoredRecipe[] = [];
  const ingredientMatches: ScoredRecipe[] = [];
  const similarRecipes: ScoredRecipe[] = [];

  scoredRecipes.forEach((recipe) => {
    if (recipe.matchScore >= 100) {
      exactMatches.push(recipe);
    } else if (recipe.matchScore >= 50) {
      partialMatches.push(recipe);
    } else if (recipe.matchType === "ingredient") {
      ingredientMatches.push(recipe);
    } else {
      similarRecipes.push(recipe);
    }
  });

  return {
    exactMatches,
    partialMatches,
    ingredientMatches,
    similarRecipes,
    hasResults: scoredRecipes.length > 0,
  };
}

/**
 * Get "Did you mean?" suggestions based on common typos
 */
export function getSuggestions(
  query: string,
  allRecipeTitles: string[]
): string[] {
  const queryLower = query.toLowerCase();
  const suggestions: { title: string; similarity: number }[] = [];

  allRecipeTitles.forEach((title) => {
    const titleLower = title.toLowerCase();
    const similarity = similarityRatio(queryLower, titleLower);

    if (similarity > 0.6 && similarity < 0.95) {
      // Close but not exact
      suggestions.push({ title, similarity });
    }
  });

  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map((s) => s.title);
}

/**
 * Example usage statistics
 */
export function getSearchStats(scoredRecipes: ScoredRecipe[]) {
  const totalRecipes = scoredRecipes.length;
  const avgScore =
    totalRecipes > 0
      ? scoredRecipes.reduce((sum, r) => sum + r.matchScore, 0) / totalRecipes
      : 0;

  const matchTypes = scoredRecipes.reduce((acc, r) => {
    acc[r.matchType] = (acc[r.matchType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRecipes,
    avgScore: Math.round(avgScore),
    matchTypes,
    hasExactMatch: scoredRecipes.some((r) => r.matchScore >= 100),
    hasPartialMatch: scoredRecipes.some((r) => r.matchScore >= 50),
  };
}
