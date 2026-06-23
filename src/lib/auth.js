import { createSupabaseServerClient } from "$lib/supabase/server";
import { redirect } from "@sveltejs/kit";

export async function getSession(event) {
  const supabase = createSupabaseServerClient(event);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth(event) {
  const session = await getSession(event);
  if (!session) {
    throw redirect(303, "/admin/login");
  }
  return session;
}

export async function login(request, email, password, event) {
  const supabase = createSupabaseServerClient(event);

  const { data: admin, error: err } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .single();
  // console.log(email);
  // console.log(admin);
  // console.log(err);
  if (!admin) {
    return { error: "Invalid credentials" };
  }

  // console.log(password);
  // console.log(admin.password_hash);

  const bcrypt = await import("bcryptjs");
  const valid = bcrypt.compareSync(password, admin.password_hash);

  if (!valid) {
    return { error: "Invalid credentials" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log(data);
  console.log(session);

  if (error) {
    return { error: error.message };
  }

  return { session: data.session };
}

export async function logout(event) {
  const supabase = createSupabaseServerClient(event);
  await supabase.auth.signOut();
}
