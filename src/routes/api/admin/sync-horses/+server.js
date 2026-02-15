import { createSupabaseServerClient } from "$lib/supabase/server";
import { getSession } from "$lib/auth";
import * as cheerio from "cheerio";

async function fetchHorsesFromStudbook() {
  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/json, text/javascript, */*; q=0.01");
  myHeaders.append("Accept-Language", "en-GB,en;q=0.9,en-US;q=0.8,id;q=0.7");
  myHeaders.append("Connection", "keep-alive");
  myHeaders.append("Referer", "https://studbook.or.id/database-kuda-aktif");
  myHeaders.append("Sec-Fetch-Dest", "empty");
  myHeaders.append("Sec-Fetch-Mode", "cors");
  myHeaders.append("Sec-Fetch-Site", "same-origin");
  myHeaders.append(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
  );
  myHeaders.append("X-Requested-With", "XMLHttpRequest");

  const targetUrl =
    "https://studbook.or.id/database-kuda-aktif?draw=1&columns%5B0%5D%5Bdata%5D=name&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&start=0&length=-1&search%5Bvalue%5D=";

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    });

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching horses:", error);
    return [];
  }
}

export const POST = async (event) => {
  const session = await getSession(event);
  console.log(session);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabase = createSupabaseServerClient(event);

  const horsesData = await fetchHorsesFromStudbook();

  if (horsesData.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "No horses fetched from studbook",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }

  const horses = horsesData.map((h) => ({
    studbook_id: h.id || null,
    name: h.name || null,
    color_name: h.color_name || null,
    birth_year: h.birth_year || null,
    gender_name: h.gender_name || null,
    generation_name: h.generation_name || null,
    owner: h.owner || null,
    breeder: h.breeder || null,
    trainer: h.trainer || null,
    updated_at: new Date().toISOString(),
  }));

  const { data, errors } = await supabase.from("horses").upsert(horses, {
    onConflict: "studbook_id",
    ignoreDuplicates: false,
  });

  if (errors && errors.length > 0) {
    console.error("Upsert errors:", errors);
    return new Response(
      JSON.stringify({ success: false, error: errors[0].message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      count: horses.length,
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    },
  );
};
