import * as cheerio from 'cheerio';

async function detailHorse(id) {
    const myHeaders = new Headers();
    // myHeaders.append("Accept", "application/json, text/javascript, */*; q=0.01");
    myHeaders.append("Accept-Language", "en-GB,en;q=0.9,en-US;q=0.8,id;q=0.7");
    myHeaders.append("Connection", "keep-alive");
    myHeaders.append("Referer", `https://studbook.or.id/${id}`);
    myHeaders.append("Sec-Fetch-Dest", "empty");
    myHeaders.append("Sec-Fetch-Mode", "cors");
    myHeaders.append("Sec-Fetch-Site", "same-origin");
    myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0");
    myHeaders.append("X-Requested-With", "XMLHttpRequest");
    myHeaders.append("sec-ch-ua", "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"Windows\"");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    const targetUrl = `https://studbook.or.id/${id}`;
 
    try {
        
        const response = await fetch(targetUrl, requestOptions);
        const html = await response.text();

        const $ = cheerio.load(html);
        const horseData = {};


        function cleanText(text) {
            if (!text) return null;
            const cleaned = text.replace(/&nbsp;/g, ' ').trim().replace(/\s\s+/g, ' ');
            return (cleaned && cleaned !== '-') ? cleaned : null;
        }

        // 1. Ekstrak Data Profil Utama
        horseData.profil = {};
        horseData.profil.nama = cleanText($('div.detail a').first().text());

        $('div.detail .section').each((i, el) => {
            const section = $(el);
            const title = cleanText(section.find('.section__title').text());

            const value = cleanText(section.clone().children().remove().end().text());

            if (title) {
                // Mengubah nama key agar lebih mudah dibaca (opsional)
                const key = title.toLowerCase()
                    .replace(/\//g, '_')
                    .replace(/\./g, '')
                    .replace(/\s+/g, '_');
                horseData.profil[key] = value;
            }
        });

        // 2. Ekstrak Data dari Tab
        horseData.pemilik = cleanText($('div#pemilik .owner-text').text());
        horseData.peternak = cleanText($('div#peternak p').text());
        horseData.pelatih = cleanText($('div#pelatih p').text());

        // 3. Ekstrak Data Silsilah (Pedigree)
        horseData.silsilah = {};
        const pedigreeTable = $('div#home table');

        if (pedigreeTable.length > 0) {
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
                            induk: cleanText(ancestors.gen4[1])
                        },
                        induk: {
                            nama: ancestors.gen3[1],
                            pejantan: cleanText(ancestors.gen4[2]),
                            induk: cleanText(ancestors.gen4[3])
                        }
                    },
                    induk: {
                        nama: ancestors.gen2[1],
                        pejantan: {
                            nama: ancestors.gen3[2],
                            pejantan: cleanText(ancestors.gen4[4]),
                            induk: cleanText(ancestors.gen4[5])
                        },
                        induk: {
                            nama: ancestors.gen3[3],
                            pejantan: cleanText(ancestors.gen4[6]),
                            induk: cleanText(ancestors.gen4[7])
                        }
                    }
                },
                induk: {
                    nama: ancestors.gen1[1],
                    pejantan: {
                        nama: ancestors.gen2[2],
                        pejantan: {
                            nama: ancestors.gen3[4],
                            pejantan: cleanText(ancestors.gen4[8]),
                            induk: cleanText(ancestors.gen4[9])
                        },
                        induk: {
                            nama: ancestors.gen3[5],
                            pejantan: cleanText(ancestors.gen4[10]),
                            induk: cleanText(ancestors.gen4[11])
                        }
                    },
                    induk: {
                        nama: ancestors.gen2[3],
                        pejantan: {
                            nama: ancestors.gen3[6],
                            pejantan: cleanText(ancestors.gen4[12]),
                            induk: cleanText(ancestors.gen4[13])
                        },
                        induk: {
                            nama: ancestors.gen3[7],
                            pejantan: cleanText(ancestors.gen4[14]),
                            induk: cleanText(ancestors.gen4[15])
                        }
                    }
                }
            };
        }

        return horseData;
    } catch (error) {
        return null;
    }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const id = url.searchParams.get('id');

    if(id != "" && id != null){
        const data = await detailHorse(id);
        if(data != null){
            return new Response(JSON.stringify(data), {
                headers: { "Content-Type": "application/json" },
                status: 200
            });
        } else {
            return new Response(JSON.stringify({ error: "Not Found" }), {
                headers: { "Content-Type": "application/json" },
                status: 404
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
    myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0");
    myHeaders.append("X-Requested-With", "XMLHttpRequest");
    myHeaders.append("sec-ch-ua", "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"Windows\"");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    // const targetUrl = "https://studbook.or.id/database-kuda-aktif?draw=1&columns%5B0%5D%5Bdata%5D=name&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&start=0&length=-1&search%5Bvalue%5D=";
    const targetUrl = "https://hashire.pages.dev/dummy-data/dump-horse.json";
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

        const kudaLainnya = [
            { "id":null,"name": "Princess Gavi", "color_name": "Napas" },
            { "id":null,"name": "Wonder Land", "color_name": "Jragem" },
            { "id":null,"name": "Kashmir Pararaja", "color_name": "Merah" },
            { "id":null,"name": "King Argentin", "color_name": "Jragem", "birth_year": "2021", "gender_name": "Colt", "generation_name": "KP6" },
        ];

        data.data = [...data.data, ...kudaLainnya]

        data.data = data.data.filter((item, index, self) =>
            index === self.findIndex((t) => t.name === item.name)
        );

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
}