const IS_FILE: boolean = location.protocol === "file:";
const IS_HTTP: boolean = location.protocol === "http:" || location.protocol === "https:";

type ParsedSuffix = { value: number; multiplier: number };

function format(fmt: string, ...args: unknown[]): string {
    let i = 0;
    return String(fmt).replace(/%[sdif]/g, (m) => {
        const v = args[i++];
        if (m === "%d" || m === "%i") return String(Number(v));
        if (m === "%f") return String(Number(v));
        return String(v);
    });
}

function parseStringForSuffix(str: string): ParsedSuffix | null {
    const multipliers: Record<string, number> = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12 };
    const match = str.match(/^(\d*\.?\d+)([kMGTPmunp]?)$/);
    if (!match) return null;
    const suffix = match[2];
    return { value: parseFloat(match[1]), multiplier: multipliers[suffix] || 1 };
}
