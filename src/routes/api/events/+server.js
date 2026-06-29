import { createSupabaseServerClient } from "$lib/supabase/server";

export const GET = async (event) => {
  const { url } = event;
  const supabase = createSupabaseServerClient(event);

  const id = url.searchParams.get("id");

  if (id) {
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify(event), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  return new Response(JSON.stringify(events || []), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
};
