import { redirect } from "@sveltejs/kit";
import { logout } from "$lib/auth";

export const POST = async (event) => {
  await logout(request);
  throw redirect(303, "/admin/login");
};
