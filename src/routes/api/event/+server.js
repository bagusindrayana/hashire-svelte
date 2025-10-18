
const baseData = [
    {
        "id": null,
        "title": "Grand Nasional Indonesia",
        "subtitle": "Jakarta",
        "date": "Cooming soon",
        "image": "https://placehold.co/800x400/5de346/208500?text=Grand Nasional Indonesia",
        "type": "race",
        "upcoming": true,
    },
    {
        "id": "ihr-seri-2-2025.json",
        "title": "Kejurnas Seri II 2025",
        "subtitle": "Indonesian Horse Racing Kejurnas Pacuan Kuda Pordasi Ke-59 Seri II 2025",
        "date": "19 Oktober 2025",
        "image": "/images/17605276099114-min.png",
        "type": "race",
        "upcoming": false,
    },
    {
        "id": "ihr-championship-cup-2-2025.json",
        "title": "Championship Cup II 2025",
        "subtitle": "Indonesian Horse Championship Cup II 2025",
        "date": "19 Oktober 2025",
        "image": "/images/payakumbuh-championship-cup-2-2025.jpg",
        "type": "race",
        "upcoming": false,
    },
    {
        "id": "merdeka-cup-2025.json",
        "title": "Merdeka Cup 2025",
        "subtitle": "Lapangan Pacuan Kuda Legok Jawa, Pangadaran, Jawab Barat",
        "date": "24 Agustus 2025",
        "image": "/images/Sarga-Sarga-Banner-Mobile-Race_889x480-2.jpg",
        "type": "race",
        "upcoming": false,
    },
    {
        "id": null,
        "title": '"Merdeka Cup" Piala Bupati Minahasa Utara',
        "subtitle": "Balitka Mapanget, Manado, Sulawesi Utara ",
        "date": "23 Agustus 2025",
        "image": "/images/535042949_17890003692325261_8917072490609251599_n_11zon.webp",
        "type": "race",
        "upcoming": false,
    },
    {
        "id": "indo-derby-2025.json",
        "title": "Indonesia's Horse Racing: Indonesia Derby 20255",
        "subtitle": "Lapangan Pacu Kuda Sultan Agung, Bantul, DIY​",
        "date": "Minggu, 27 Juli 2025",
        "image": "/images/Sarga-IHR-Derby-2025-Homepage-889x480-1-min.png",
        "type": "race",
        "upcoming": false,
    },

];

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {


    const id = url.searchParams.get('id');
    if (id != "" && id != null) {
        let data = null;
        for (let i = 0; i < baseData.length; i++) {
            const d = baseData[i];
            if (d.id == id) {
                data = d;
            }

            if (data) {
                return new Response(JSON.stringify(data), {
                    headers: { "Content-Type": "application/json" },
                    status: 200
                });
            }
        }
    }



    const data = baseData;
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 200
    });
}