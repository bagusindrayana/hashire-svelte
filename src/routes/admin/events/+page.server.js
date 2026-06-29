import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const supabase = createSupabaseServerClient(event);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  return { events: events || [] };
};
