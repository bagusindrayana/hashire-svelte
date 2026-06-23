import { getSession } from "$lib/auth";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const session = await getSession(event);

  if (!session) {
    return {
      session: null,
      horsesCount: 0,
      eventsCount: 0,
      newsCount: 0,
    };
  }

  const supabase = createSupabaseServerClient(event);

  const [horsesCount, eventsCount, newsCount] = await Promise.all([
    supabase.from("horses").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("news").select("*", { count: "exact", head: true }),
  ]);

  return {
    session,
    horsesCount: horsesCount.count || 0,
    eventsCount: eventsCount.count || 0,
    newsCount: newsCount.count || 0,
  };
};
