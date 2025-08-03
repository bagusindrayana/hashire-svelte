/** @type {import('./$types').PageLoad} */
export async function load({ url, fetch }) {
    const idHorse = url.searchParams.get('id');
    let openHorse = null;
    if(idHorse != null && idHorse != ""){
        const res = await fetch("/api/horse?id=" + idHorse);
        const json = await res.json();
        openHorse = json;
    }
    return { idHorse,openHorse };
}