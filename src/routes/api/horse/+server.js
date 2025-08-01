

/** @type {import('./$types').RequestHandler} */
export async function GET() {

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

    const url = "https://studbook.or.id/database-kuda-aktif?draw=1&columns%5B0%5D%5Bdata%5D=name&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&start=0&length=-1&search%5Bvalue%5D=";
    try {
        const response = await fetch(url, requestOptions);
        const text = await response.text();

        // If it's JSON, try to parse it
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text }; // fallback if not valid JSON
        }

        const kudaLainnya = [
            {"name": "Princess Gavi","color_name":"Napas"},
            {"name": "Wonder Land", "color_name":"Jragem"},
            {"name": "Kashmir Pararaja", "color_name":"Merah"},
            {"name": "King Argentine", "color_name":"Jragem","birth_year":"2021"},
        ];

        data.data = [...data.data, ...kudaLainnya]

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
}