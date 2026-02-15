import { error } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const load = async (event) => {
  const supabase = createSupabaseServerClient(event);

  const { data: horse, error: err } = await supabase
    .from("horses")
    .select("*")
    .eq("id", event.params.id)
    .single();

  if (err || !horse) {
    throw error(404, "Horse not found");
  }

  return { horse };
};

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    const horse = {
      name: formData.get("name"),
      color_name: formData.get("color_name") || null,
      birth_year: formData.get("birth_year") || null,
      gender_name: formData.get("gender_name") || null,
      generation_name: formData.get("generation_name") || null,
      owner: formData.get("owner") || null,
      breeder: formData.get("breeder") || null,
      trainer: formData.get("trainer") || null,
      updated_at: new Date().toISOString(),
    };

    if (!horse.name) {
      return { error: "Name is required" };
    }

    const supabase = createSupabaseServerClient(event);

    const { error: err } = await supabase
      .from("horses")
      .update(horse)
      .eq("id", event.params.id);

    if (err) {
      return { error: err.message };
    }

    return { success: true };
  },
};
