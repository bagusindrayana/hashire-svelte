
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
        "id": "merdeka-cup-2025.json",
        "title": "Merdeka Cup 2025",
        "subtitle": "Lapangan Pacuan Kuda Legok Jawa, Pangadaran, Jawab Barat",
        "date": "24 Agustus 2025",
        "image": "https://freeimghost.net/images/2025/08/24/Sarga-Sarga-Banner-Mobile-Race_889x480-2.jpg",
        "type": "race",
        "upcoming": false,
    },
    {
        "id": null,
        "title": '"Merdeka Cup" Piala Bupati Minahasa Utara',
        "subtitle": "Balitka Mapanget, Manado, Sulawesi Utara ",
        "date": "23 Agustus 2025",
        "image": "https://s6.imgcdn.dev/YImIca.jpg",
        "type": "race",
        "upcoming": false,
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