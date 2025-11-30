export function cleanName(str) {
    if(str == null) {
        return '';
    }
    const innerText = str.replace(/<[^>]*>/g, '');
    return innerText;
}