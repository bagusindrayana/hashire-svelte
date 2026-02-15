import { error } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const supabase = createSupabaseServerClient(event);

  const { data: news, error: err } = await supabase
    .from("news")
    .select("*")
    .eq("id", event.params.id)
    .single();

  if (err || !news) {
    throw error(404, "News not found");
  }

  return { news };
};

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    const news = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || null,
      date: formData.get("date") || null,
      news_type: formData.get("news_type") || "news",
      image_url: formData.get("image_url") || null,
      updated_at: new Date().toISOString(),
    };

    if (!news.title) {
      return { error: "Title is required" };
    }

    const supabase = createSupabaseServerClient(event);

    const { error: err } = await supabase
      .from("news")
      .update(news)
      .eq("id", event.params.id);

    if (err) {
      return { error: err.message };
    }

    return { success: true };
  },
};
