import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export interface SessionHistory {
  id: string;
  created_at: string;
  ingredients: string[];
  recipe: {
    title: string;
  };
}

export function useRecipeHistory() {
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("recipe_sessions")
        .select("id, created_at, ingredients, recipe")
        .order("created_at", { ascending: false })
        .limit(20);

      setHistory(data || []);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  return { history, loading };
}
