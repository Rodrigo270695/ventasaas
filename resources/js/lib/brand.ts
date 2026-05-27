/** Logo principal de marca (archivo en /public). */
export const BRAND_LOGO_PATH = '/LOGO CHOKO HOUSE.png';

export function brandLogoSrc(): string {
    return encodeURI(BRAND_LOGO_PATH);
}
