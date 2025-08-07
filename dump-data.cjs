const dumpData = require('./static/dummy-data/dump-horse.json');
const unknownData = require('./static/dummy-data/indo-derby-2025.json');
const cheerio = require('cheerio');
const fs = require('fs/promises');

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
        console.log(error);
        return null;
    }
}

async function scrapeData() {
    for (let i = 0; i < unknownData.length; i++) {
        const d = unknownData[i];
        for (let x = 0; x < d.horses.length; x++) {
            const h = d.horses[x];
            let hindex = dumpData.data.findIndex(function (dd) {
                return dd.name != null && dd.name.toLowerCase().includes(h.name.toLowerCase());
            });
            if (hindex == -1) {
                const updateData = await detailHorse(h.name);
                if(updateData && updateData.profil.nama != null){
                    const silsilahFather = updateData.silsilah != null && updateData.silsilah.pejantan != null ? updateData.silsilah.pejantan.nama : null;
                    let fatherName = null;
                    if(silsilahFather){
                        const matchFather = silsilahFather.match(/^(.*?)\s\([A-Z]{2,3}\)\s-\s\d{4}$/);
                        fatherName = matchFather ? matchFather[1] : null;
                    }

                    const silsilahMother = updateData.silsilah != null && updateData.silsilah.pejantan != null ? updateData.silsilah.pejantan.nama : null;
                    let motherName = null;
                    if(silsilahMother){
                        const matchMother = silsilahMother.match(/^(.*?)\s\([A-Z]{2,3}\)\s-\s\d{4}$/);
                        motherName = matchMother ? matchMother[1] : null;
                    }
                    const newData = {
                        "name": updateData.profil.nama,
                        "owner": updateData.pemilik,
                        "height": updateData.profil.tinggi,
                        "trainer": updateData.pelatih,
                        "discipline": updateData.profil.disiplin,
                        "color_name": updateData.profil.warna,
                        "gender_name": updateData.profil.jenis_kelamin == "Jantan" ? "Colt" : "Filly",
                        "birth_year": updateData.profil.tanggal_lahir != null && updateData.profil.tanggal_lahir != "" ? updateData.profil.tanggal_lahir.split(" ")[2] : null,
                        "generation_name": updateData.profil.trah,
                        "contact": null,
                        "father_name": fatherName,
                        "mother_name": motherName,
                        "breed_name": updateData.profil.trah,
                    };
                    dumpData.data.push(newData);
                    console.log(newData);
                } else {
                    const newData = {
                        "name": h.name,
                        "owner": null,
                        "height": null,
                        "trainer": null,
                        "discipline": null,
                        "color_name": null,
                        "gender_name": null,
                        "birth_year": null,
                        "generation_name": null,
                        "contact": null,
                        "father_name": null,
                        "mother_name": null,
                        "breed_name": null,
                    };
                    dumpData.data.push(newData);
                    console.log(newData);
                }
            }


        }
    }

    try {
        await fs.writeFile('./static/dummy-data/dump-horse.json', JSON.stringify(dumpData, null, 2));
        console.log('Data written to json file');
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

scrapeData();