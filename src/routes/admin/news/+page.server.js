import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const supabase = createSupabaseServerClient(event);

  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("date", { ascending: false });

  return { news: news || [] };
};
