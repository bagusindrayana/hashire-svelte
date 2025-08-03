/** @type {import('./$types').PageLoad} */
export async function load({ url, fetch }) {
    const idEvent = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    let openEvent = null;
    if(type == "race" && idEvent != ""  && idEvent != null){
        const res = await fetch("/api/event?id=" + idEvent);
        const json = await res.json();
        openEvent = json;
    }
    return { idEvent,openEvent };
}