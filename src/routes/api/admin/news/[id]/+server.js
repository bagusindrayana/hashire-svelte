import { createSupabaseServerClient } from "$lib/supabase/server";
import { getSession } from "$lib/auth";

export const DELETE = async (event) => {
  const session = await getSession(event);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabase = createSupabaseServerClient(event);

  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", event.params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
};
