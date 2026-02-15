import { fail, redirect } from "@sveltejs/kit";
import { login } from "$lib/auth";

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      return fail(400, { error: "Email dan password wajib diisi" });
    }

    const result = await login(event.request, email, password, event);

    if (result.error) {
      return fail(401, { error: result.error });
    }

    throw redirect(303, "/admin");
  },
};
