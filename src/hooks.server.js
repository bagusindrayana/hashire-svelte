import { getSession } from "$lib/auth";
import { redirect } from "@sveltejs/kit";

export async function handle({ event, resolve }) {
  const { pathname } = event.url;

  // Protect admin routes (excluding login page itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await getSession(event);
    if (!session) {
      throw redirect(303, "/admin/login");
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    const session = await getSession(event);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (pathname === "/admin/login") {
    const session = await getSession(event);
    if (session) {
      throw redirect(303, "/admin");
    }
  }

  return resolve(event);
}
