import { fail, redirect } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    const eventData = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || null,
      date: formData.get("date") || null,
      event_type: formData.get("event_type") || "race",
      image_url: formData.get("image_url") || null,
      upcoming: formData.get("upcoming") === "true",
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
