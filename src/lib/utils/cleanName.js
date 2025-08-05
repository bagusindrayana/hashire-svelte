export function cleanName(str) {
    const innerText = str.replace(/<[^>]*>/g, '');
    return innerText;
}