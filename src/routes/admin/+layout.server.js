import { redirect } from "@sveltejs/kit";
import { getSession } from "$lib/auth";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const session = await getSession(event);
  // console.log(session);
  //bukan route login
  if (!session && !event.request.url.includes("/admin")) {
    throw redirect(303, "/admin/login");
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
