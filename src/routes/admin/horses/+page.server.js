import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const supabase = createSupabaseServerClient(event);

  const { data: horses } = await supabase
    .from("horses")
    .select("*")
    .order("name", { ascending: true });

  return { horses: horses || [] };
};
