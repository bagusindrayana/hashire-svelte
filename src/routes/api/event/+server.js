
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
        "id": null,
        "title": "Derby Nusantara: Kejuaraan Pacuan Kuda Indonesia",
        "subtitle": "Jakarta",
        "date": "15-17 Agustus 2025",
        "image": "https://pordasi.id/wp-content/themes/mainz/public/img/event/event-1.webp",
        "type": "race",
        "upcoming": true,
    },
    {
        "id": "indo-derby-2025.json",
        "title": "Indonesia's Horse Racing: Indonesia Derby 20255",
        "subtitle": "Lapangan Pacu Kuda Sultan Agung, Bantul, DIY​",
        "date": "Minggu, 27 Juli 2025",
        "image": "https://sarga.co/wp-content/uploads/2025/07/Sarga-IHR-Derby-2025-Homepage-889x480-1.png",
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