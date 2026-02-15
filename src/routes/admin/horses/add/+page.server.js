import { fail, redirect } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();

    const horse = {
      id: crypto.randomUUID(),
      name: formData.get("name"),
      color_name: formData.get("color_name") || null,
      birth_year: formData.get("birth_year") || null,
      gender_name: formData.get("gender_name") || null,
      generation_name: formData.get("generation_name") || null,
      owner: formData.get("owner") || null,
      breeder: formData.get("breeder") || null,
      trainer: formData.get("trainer") || null,
    };

    if (!horse.name) {
      return fail(400, { error: "Name is required" });
    }

    const supabase = createSupabaseServerClient(event);

    const { error } = await supabase.from("horses").insert(horse);

    if (error) {
      return fail(500, { error: error.message });
    }

    throw redirect(303, "/admin/horses");
  },
};
