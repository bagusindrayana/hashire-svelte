import { createServerClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

export const createSupabaseServerClient = (event) => {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),

      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, {
            path: "/",
            httpOnly: true,
            sameSite: "lax", // 👈 important for localhost
            secure: false, // 👈 disable secure in dev
            ...options,
          });
        });
      },
    },
  });
};
