type VetImageSource = {
  id: string;
  name: string;
  city?: string | null;
  imageUrl?: string | null;
};

const palettes = [
  ["#f9e7ff", "#ffe1ee", "#9b78df"],
  ["#e7f5ff", "#ffe8f1", "#5f8ddf"],
  ["#fff0d6", "#ffe0e8", "#f49b5f"],
  ["#e8fff4", "#f7e7ff", "#46b889"],
  ["#f3edff", "#ffe5dc", "#a66be6"],
  ["#fff4f8", "#e9f4ff", "#f76589"],
  ["#f5f0ff", "#fff3cf", "#8b6bd9"],
  ["#eaf8ff", "#fff0f3", "#4e9fcb"]
];

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function escapeSvgText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initials(name: string) {
  const parts = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["clinic", "veterinary", "vet", "animal", "surgeri", "surgery"].includes(part.toLowerCase()));

  return (parts.length ? parts : name.split(/\s+/))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function vetPlaceholderImage(vet: VetImageSource) {
  const seed = hashText(`${vet.id}:${vet.name}:${vet.city ?? ""}`);
  const [start, end, accent] = palettes[seed % palettes.length];
  const rotation = (seed % 18) - 9;
  const label = escapeSvgText(initials(vet.name) || "VT");
  const city = escapeSvgText(vet.city ?? "Veterinary care");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#7a5148" flood-opacity=".13"/>
        </filter>
      </defs>
      <rect width="420" height="420" rx="74" fill="url(#bg)"/>
      <circle cx="328" cy="84" r="84" fill="#fff" opacity=".35"/>
      <circle cx="96" cy="336" r="118" fill="#fff" opacity=".24"/>
      <g opacity=".22" fill="${accent}">
        <circle cx="92" cy="88" r="14"/>
        <circle cx="128" cy="70" r="18"/>
        <circle cx="164" cy="88" r="14"/>
        <circle cx="114" cy="122" r="18"/>
        <path d="M136 111c28 1 50 38 28 60-13 13-43 6-56 6s-43 7-56-6c-22-22 0-59 28-60 16 0 22 12 28 12s12-12 28-12z"/>
      </g>
      <g transform="rotate(${rotation} 210 202)" filter="url(#soft)">
        <rect x="122" y="132" width="176" height="156" rx="34" fill="#fff" opacity=".88"/>
        <path d="M166 288v-94c0-15 12-27 27-27h34c15 0 27 12 27 27v94" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
        <path d="M210 154v86M167 197h86" stroke="${accent}" stroke-width="20" stroke-linecap="round"/>
      </g>
      <text x="210" y="343" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="900" fill="${accent}">${label}</text>
      <text x="210" y="378" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#7a5148" opacity=".68">${city}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ensureVetImage<T extends VetImageSource>(vet: T): T {
  return {
    ...vet,
    imageUrl: vet.imageUrl || vetPlaceholderImage(vet)
  };
}

export function ensureUniqueVetImages<T extends VetImageSource>(vets: T[]) {
  const seen = new Set<string>();

  return vets.map((vet) => {
    const imageUrl = vet.imageUrl?.trim() || "";
    if (!imageUrl || seen.has(imageUrl)) {
      const placeholder = vetPlaceholderImage(vet);
      seen.add(placeholder);
      return { ...vet, imageUrl: placeholder };
    }

    seen.add(imageUrl);
    return { ...vet, imageUrl };
  });
}
