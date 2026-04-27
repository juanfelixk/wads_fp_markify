const ACCENT_COLORS = [
    "220 60% 35%", "160 45% 30%", "280 40% 35%", "35 55% 40%",
    "340 45% 40%", "190 50% 30%", "0 50% 40%", "250 45% 40%",
    "15 60% 38%", "200 55% 32%", "300 40% 38%", "60 50% 35%",
    "170 45% 28%", "320 50% 38%", "90 45% 32%", "230 50% 42%",
    "10 55% 42%", "140 45% 30%", "265 45% 38%", "45 55% 36%",
    "185 50% 32%", "355 50% 38%", "210 55% 38%", "120 40% 30%",
];

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export function getAccentColor(key: string): string {
    const index = hashString(key) % ACCENT_COLORS.length;
    return ACCENT_COLORS[index];
}