import { fail, redirect } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    const news = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || null,
      date: formData.get("date") || null,
      news_type: formData.get("news_type") || "news",
      image_url: formData.get("image_url") || null,
    };

    if (!news.title) {
      return fail(400, { error: "Title is required" });
    }

    const supabase = createSupabaseServerClient(event);

    const { error } = await supabase.from("news").insert(news);

    if (error) {
      return fail(500, { error: error.message });
    }

    throw redirect(303, "/admin/news");
  },
};
