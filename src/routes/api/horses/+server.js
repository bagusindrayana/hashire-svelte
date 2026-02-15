import { createSupabaseServerClient } from "$lib/supabase/server";

export const GET = async (event) => {
  const { request, url } = event;
  const supabase = createSupabaseServerClient(event);

  const id = url.searchParams.get("id");

  if (id) {
    const { data: horse } = await supabase
      .from("horses")
      .select("*")
      .eq("id", id)
      .single();

    if (!horse) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify(horse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const { data: horses } = await supabase
    .from("horses")
    .select("*")
    .order("name", { ascending: true });

  return new Response(JSON.stringify({ data: horses || [] }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
};
