

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    const data = [
        {
            "title": "King Argentine, Juara Piala Tiga Mahkota 2025",
            "subtitle": "Sejarah baru terukir indah dari Lapangan Pacu Kuda Sultan Agung, Bantul DI Yogyakarta",
            "image": null,
            "date": "Senin, 28 Juli 2025",
            "type": "news"
        },
        {
            "title": "Indonesia's Horse Racing: Indonesia Derby 20255",
            "subtitle": "Lapangan Pacu Kuda Sultan Agung, Bantul, DIY​",
            "date":"Minggu, 27 Juli 2025",
            "image": "https://sarga.co/wp-content/uploads/2025/07/Sarga-IHR-Derby-2025-Homepage-889x480-1.png",
            "type": "race"
        },
        {
            "title": "King Argentine, Kandidat Terkuat Peraih Gelar Piala Tiga Mahkota Tahun 2025",
            "subtitle": "Jelang pelaksanaan kejuaraan pacuan kuda bertajuk Indonesia’s Horse Racing Indonesia Derby 2025",
            "date":"Kamis, 24 Juli 2025",
            "image": null,
            "type": "news"
        },
        
        
    ];
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 200
    });
}