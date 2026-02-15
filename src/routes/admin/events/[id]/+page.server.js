import { error } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const supabase = createSupabaseServerClient(event);

  const { data: event, error: err } = await supabase
    .from("events")
    .select("*")
    .eq("id", event.params.id)
    .single();

  if (err || !event) {
    throw error(404, "Event not found");
  }

  return { event };
};

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    const event = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || null,
      date: formData.get("date") || null,
      event_type: formData.get("event_type") || "race",
      image_url: formData.get("image_url") || null,
      upcoming: formData.get("upcoming") === "true",
      updated_at: new Date().toISOString(),
    };

    if (!event.title) {
      return { error: "Title is required" };
    }

    const supabase = createSupabaseServerClient(event);

    const { error: err } = await supabase
      .from("events")
      .update(event)
      .eq("id", event.params.id);

    if (err) {
      return { error: err.message };
    }

    return { success: true };
  },
};
