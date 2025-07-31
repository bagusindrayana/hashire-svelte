/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  const res = await fetch('/api/horse');
  const dataKuda = await res.json();

  return { dataKuda };
}