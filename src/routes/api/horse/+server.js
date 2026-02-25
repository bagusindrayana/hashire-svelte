import * as cheerio from "cheerio";
import { createSupabaseServerClient } from "$lib/supabase/server";

async function detailHorse(id) {
  const myHeaders = new Headers();
  // myHeaders.append("Accept", "application/json, text/javascript, */*; q=0.01");
  myHeaders.append("Accept-Language", "en-GB,en;q=0.9,en-US;q=0.8,id;q=0.7");
  myHeaders.append("Connection", "keep-alive");
  myHeaders.append("Referer", `https://studbook.or.id/${id}`);
  myHeaders.append("Sec-Fetch-Dest", "empty");
  myHeaders.append("Sec-Fetch-Mode", "cors");
  myHeaders.append("Sec-Fetch-Site", "same-origin");
  myHeaders.append(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
  );
  myHeaders.append("X-Requested-With", "XMLHttpRequest");
  myHeaders.append(
    "sec-ch-ua",
    '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
  );
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append("sec-ch-ua-platform", '"Windows"');

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
    // agent:agent,
  };

  //const targetUrl = `https://studbook.or.id/${id}`;
  const targetUrl = `https://studbook.or.id/idn/engine/horse_data.php?q=${id}&mode=exact`;
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  try {
    const response = await fetch(targetUrl, requestOptions);
    const html = await response.text();
    const $ = cheerio.load(html);
    const horseData = {};

    function cleanText(text) {
      if (!text) return null;
      const cleaned = text
        .replace(/&nbsp;/g, " ")
        .trim()
        .replace(/\s\s+/g, " ");
      return cleaned && cleaned !== "-" ? cleaned : null;
    }

    // 1. Ekstrak Data Profil Utama
    horseData.profil = {};

    // Nama & Tahun Lahir
    let horseName = cleanText($("span.horse-name").first().text());
    if (!horseName) {
      horseName = cleanText($("div.detail .horse-name").first().text()); // Fallback
    }
    horseData.profil.nama = horseName;

    const yob = cleanText($("span.horse-yob").first().text());
    if (yob) {
      horseData.profil.tahun_lahir = yob.replace(/[\(\)]/g, '').trim();
    }

    // Extract dari old format HTML
    $("div.detail .section").each((i, el) => {
      const section = $(el);
      const title = cleanText(section.find(".section__title").text());
      const value = cleanText(section.clone().children().remove().end().text());

      if (title) {
        const key = title
          .toLowerCase()
          .replace(/\//g, "_")
          .replace(/\./g, "")
          .replace(/\s+/g, "_");
        horseData.profil[key] = value;
      }
    });

    // Extract dari new format HTML (meta-row)
    $("div.horse-meta .meta-row").each((i, el) => {
      const label = cleanText($(el).find(".meta-label").text());
      const value = cleanText($(el).find(".meta-value").text());
      if (label) {
        const key = label
          .toLowerCase()
          .replace(/\//g, "_")
          .replace(/\./g, "")
          .replace(/\s+/g, "_")
          .replace(/&amp;/g, "and");
        horseData.profil[key] = value;
      }
    });

    // 2. Ekstrak Data Pemilik / Peternakan dari Tab (Old style) dan setelan pemilik peternak langsung dari data baru
    horseData.pemilik = cleanText($("div#pemilik .owner-text").text());
    horseData.peternak = cleanText($("div#peternak p").text());
    horseData.pelatih = cleanText($("div#pelatih p").text());

    // Coba mapping fallback jika field lama kosong dari data baru
    if (!horseData.pemilik && horseData.profil.nama_pemilik) {
      horseData.pemilik = horseData.profil.nama_pemilik;
    }
    if (!horseData.peternak && horseData.profil.nama_peternak) {
      horseData.peternak = horseData.profil.nama_peternak;
    }
    if (!horseData.pelatih && horseData.profil.nama_pelatih) {
      horseData.pelatih = horseData.profil.nama_pelatih;
    }

    // 3. Ekstrak Data Silsilah (Pedigree)
    horseData.silsilah = {};
    const svgSilsilah = $("div#tab-silsilah svg");
    const pedigreeTable = $("div#home table");

    if (svgSilsilah.length > 0) {
      // Logic Parsing SVG Baru
      const svgAncestors = {
        gen1: new Array(2).fill(null),
        gen2: new Array(4).fill(null),
        gen3: new Array(8).fill(null),
        gen4: new Array(16).fill(null),
      };

      svgSilsilah.find("a text[font-size='12'][text-anchor='start']").each((i, el) => {
        const x = parseFloat($(el).attr('x'));
        const y = parseFloat($(el).attr('y'));
        const name = cleanText($(el).find("tspan").first().text());

        if (!isNaN(x) && !isNaN(y) && name) {
          let gen = 1;
          if (x > 200 && x < 400) gen = 2;
          else if (x >= 400 && x < 600) gen = 3;
          else if (x >= 600) gen = 4;

          const maxSlots = Math.pow(2, gen);
          const slotHeight = 858 / maxSlots;
          const slotIndex = Math.floor(y / slotHeight);

          if (slotIndex >= 0 && slotIndex < maxSlots) {
            svgAncestors[`gen${gen}`][slotIndex] = name;
          }
        }
      });

      horseData.silsilah = {
        pejantan: {
          nama: svgAncestors.gen1[0],
          pejantan: {
            nama: svgAncestors.gen2[0],
            pejantan: {
              nama: svgAncestors.gen3[0],
              pejantan: svgAncestors.gen4[0],
              induk: svgAncestors.gen4[1],
            },
            induk: {
              nama: svgAncestors.gen3[1],
              pejantan: svgAncestors.gen4[2],
              induk: svgAncestors.gen4[3],
            },
          },
          induk: {
            nama: svgAncestors.gen2[1],
            pejantan: {
              nama: svgAncestors.gen3[2],
              pejantan: svgAncestors.gen4[4],
              induk: svgAncestors.gen4[5],
            },
            induk: {
              nama: svgAncestors.gen3[3],
              pejantan: svgAncestors.gen4[6],
              induk: svgAncestors.gen4[7],
            },
          },
        },
        induk: {
          nama: svgAncestors.gen1[1],
          pejantan: {
            nama: svgAncestors.gen2[2],
            pejantan: {
              nama: svgAncestors.gen3[4],
              pejantan: svgAncestors.gen4[8],
              induk: svgAncestors.gen4[9],
            },
            induk: {
              nama: svgAncestors.gen3[5],
              pejantan: svgAncestors.gen4[10],
              induk: svgAncestors.gen4[11],
            },
          },
          induk: {
            nama: svgAncestors.gen2[3],
            pejantan: {
              nama: svgAncestors.gen3[6],
              pejantan: svgAncestors.gen4[12],
              induk: svgAncestors.gen4[13],
            },
            induk: {
              nama: svgAncestors.gen3[7],
              pejantan: svgAncestors.gen4[14],
              induk: svgAncestors.gen4[15],
            },
          },
        },
      };

    } else if (pedigreeTable.length > 0) {
      // Logic Tabel Lama
      const ancestors = {};
      ancestors.gen1 = pedigreeTable.find('td[rowspan="16"]').map((i, el) => cleanText($(el).text())).get();
      ancestors.gen2 = pedigreeTable.find('td[rowspan="8"]').map((i, el) => cleanText($(el).text())).get();
      ancestors.gen3 = pedigreeTable.find('td[rowspan="4"]').map((i, el) => cleanText($(el).text())).get();
      ancestors.gen4 = pedigreeTable.find('td[rowspan="2"]').map((i, el) => cleanText($(el).text())).get();

      horseData.silsilah = {
        pejantan: {
          nama: ancestors.gen1[0],
          pejantan: {
            nama: ancestors.gen2[0],
            pejantan: {
              nama: ancestors.gen3[0],
              pejantan: cleanText(ancestors.gen4[0]),
              induk: cleanText(ancestors.gen4[1]),
            },
            induk: {
              nama: ancestors.gen3[1],
              pejantan: cleanText(ancestors.gen4[2]),
              induk: cleanText(ancestors.gen4[3]),
            },
          },
          induk: {
            nama: ancestors.gen2[1],
            pejantan: {
              nama: ancestors.gen3[2],
              pejantan: cleanText(ancestors.gen4[4]),
              induk: cleanText(ancestors.gen4[5]),
            },
            induk: {
              nama: ancestors.gen3[3],
              pejantan: cleanText(ancestors.gen4[6]),
              induk: cleanText(ancestors.gen4[7]),
            },
          },
        },
        induk: {
          nama: ancestors.gen1[1],
          pejantan: {
            nama: ancestors.gen2[2],
            pejantan: {
              nama: ancestors.gen3[4],
              pejantan: cleanText(ancestors.gen4[8]),
              induk: cleanText(ancestors.gen4[9]),
            },
            induk: {
              nama: ancestors.gen3[5],
              pejantan: cleanText(ancestors.gen4[10]),
              induk: cleanText(ancestors.gen4[11]),
            },
          },
          induk: {
            nama: ancestors.gen2[3],
            pejantan: {
              nama: ancestors.gen3[6],
              pejantan: cleanText(ancestors.gen4[12]),
              induk: cleanText(ancestors.gen4[13]),
            },
            induk: {
              nama: ancestors.gen3[7],
              pejantan: cleanText(ancestors.gen4[14]),
              induk: cleanText(ancestors.gen4[15]),
            },
          },
        },
      };
    }

    // 4. Ekstrak Keturunan & Saudara (Data Baru)
    function extractTable(tableSelector) {
      const t = $(tableSelector);
      if (t.length === 0) return [];
      const result = [];
      t.find("tbody tr").each((i, el) => {
        const tr = $(el);
        if (tr.hasClass("empty-row") || tr.find("td").length === 0) return;
        const links = tr.find("td a").first();
        const hidMatch = links.attr("href") ? links.attr("href").match(/hid=(\d+)/) : null;
        const id = hidMatch ? hidMatch[1] : null;
        const tds = tr.find("td");
        result.push({
          id: id,
          nama: cleanText(tds.eq(0).text()),
          orang_tua: cleanText(tds.eq(1).text()),
          tanggal_lahir: cleanText(tds.eq(2).text()),
          jenis_kelamin: cleanText(tds.eq(3).text()),
          warna: cleanText(tds.eq(4).text()),
          trah: cleanText(tds.eq(5).text())
        });
      });
      return result;
    }

    horseData.keturunan = extractTable("#tab-keturunan table.data-table");
    horseData.saudara_pejantan = extractTable("#tab-saudara-sire table.data-table");
    horseData.saudara_induk = extractTable("#tab-saudara-mare table.data-table");

    return horseData;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const GET = async (event) => {
  const { url, request } = event;
  const id = url.searchParams.get("id");

  if (id != "" && id != null) {
    const data = await detailHorse(id);
    if (data != null) {
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }
  }

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
  myHeaders.append(
    "sec-ch-ua",
    '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
  );
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append("sec-ch-ua-platform", '"Windows"');

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
    // agent:agent
  };

  const host = event.request.url.replace("/api/horse", "");
  let targetUrl = host + "/dummy-data/dump-horse.json?d=24-08-2025";
  if (url.searchParams.get("update")) {
    targetUrl =
      "https://studbook.or.id/database-kuda-aktif?draw=1&columns%5B0%5D%5Bdata%5D=name&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&start=0&length=-1&search%5Bvalue%5D=";
  }
  try {
    const response = await fetch(targetUrl, requestOptions);
    const text = await response.text();

    // If it's JSON, try to parse it
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text }; // fallback if not valid JSON
    }

    // const kudaLainnya = [
    //     { "id":null,"name": "Princess Gavi", "color_name": "Napas" },
    //     { "id":null,"name": "Wonder Land", "color_name": "Jragem" },
    //     { "id":null,"name": "Kashmir Pararaja", "color_name": "Merah" },
    //     { "id":null,"name": "King Argentin", "color_name": "Jragem", "birth_year": "2021", "gender_name": "Colt", "generation_name": "KP6" },
    // ];

    // data.data = [...data.data, ...kudaLainnya]

    data.data = data.data.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.name === item.name),
    );

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
};
