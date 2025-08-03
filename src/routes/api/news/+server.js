

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    const data = [
        {   
            "id":null,
            "title": "Umazing! SARGA.CO Gelar Kompetisi Fan Art Rayakan Kemenangan Sang Juara Triple Crown Indonesia, King Argentin",
            "subtitle": "Melalui unggahan di platform X (dahulu Twitter), penyelenggara balapan Indonesia Horse Racing (SARGA.CO) secara terbuka mengapresiasi komunitas penggemar gim besutan Cygames ini. Mulai dari kehadiran di tribun, parade fan art di media sosial, hingga dukungan digital berbalut semangat anime, sukses menyulap atmosfer Derby jadi lebih hidup, unik, dan penuh warna.",
            "image": null,
            "date": "Rabu, 30 Juli 2025",
            "type": "news"
        },
        {   
            "id":null,
            "title": "King Argentin, Juara Piala Tiga Mahkota 2025",
            "subtitle": "Sejarah baru terukir indah dari Lapangan Pacu Kuda Sultan Agung, Bantul DI Yogyakarta",
            "image": null,
            "date": "Senin, 28 Juli 2025",
            "type": "news"
        },
        {   
            "id":"indo-derby-2025.json",
            "title": "Indonesia's Horse Racing: Indonesia Derby 20255",
            "subtitle": "Lapangan Pacu Kuda Sultan Agung, Bantul, DIY​",
            "date":"Minggu, 27 Juli 2025",
            "image": "https://sarga.co/wp-content/uploads/2025/07/Sarga-IHR-Derby-2025-Homepage-889x480-1.png",
            "type": "race"
        },
        {   
            "id":null,
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