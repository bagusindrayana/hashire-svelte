import { fail, redirect } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    let detail_data = null;
    const rawDetail = formData.get("detail_data");
    if (rawDetail) {
      try {
        const parsed = JSON.parse(rawDetail);
        detail_data = Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch {
        // biarkan null jika JSON tidak valid
      }
    }

    const eventData = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || null,
      date: formData.get("date") || null,
      event_type: formData.get("event_type") || "race",
      image_url: formData.get("image_url") || null,
      upcoming: formData.get("upcoming") === "true",
      detail_data,
    };

    if (!eventData.title) {
      return fail(400, { error: "Title is required" });
    }

    const supabase = createSupabaseServerClient(event);

    const { error } = await supabase.from("events").insert(eventData);

    if (error) {
      return fail(500, { error: error.message });
    }

    throw redirect(303, "/admin/events");
  },
};
