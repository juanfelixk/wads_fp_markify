export function getAvatarUrl(name: string, size = 128): string {
  const cleaned = (name.trim() || "User")
    .replace(/^((?:(?:Dr|Prof|Mr|Ms|Mrs|Ir)\.?\s+)+)/i, "")
    .replace(/,\s*[A-Z][A-Za-z.]+(\s*,\s*[A-Z][A-Za-z.]+)*/g, "");
  const encodedName = encodeURIComponent(cleaned.trim() || "User");
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=1e3a5f&color=fff&bold=true`;
}