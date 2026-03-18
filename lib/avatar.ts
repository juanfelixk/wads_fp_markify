export function getAvatarUrl(name: string, size = 128): string {
  const encodedName = encodeURIComponent(name.trim() || "User");
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=1e3a5f&color=fff&bold=true`;
}