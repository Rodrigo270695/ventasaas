/** Primeras letras del nombre para sugerir código (sin acentos, solo A-Z0-9). */
export function suggestCodeFromName(name: string, length = 3): string {
    return name
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, length);
}

export function sanitizeCatalogCode(value: string, maxLength = 20): string {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, maxLength);
}

export function sanitizeSunatCode(value: string, maxLength = 3): string {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, maxLength);
}

/** Símbolo corto en minúsculas (ej. und, kg). */
export function suggestSymbolFromName(name: string, length = 3): string {
    return suggestCodeFromName(name, length).toLowerCase();
}

export function sanitizeSymbol(value: string, maxLength = 10): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, maxLength);
}

export function suggestSkuFromName(name: string, length = 8): string {
    return suggestCodeFromName(name, length);
}

export function sanitizeSku(value: string, maxLength = 50): string {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, maxLength);
}
