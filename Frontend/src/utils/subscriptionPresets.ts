/**
 * Logos das assinaturas — cadastre as URLs AQUI no código.
 *
 * Para cada serviço você pode:
 * - Preencher `imageUrl` com URL absoluta (https://...) ou caminho em `public/`
 *   (ex.: "/logos/netflix.png" após colocar o arquivo em Frontend/public/logos/).
 * - Deixar `imageUrl` vazio: será usado o fallback Clearbit a partir de `domain`.
 *
 * Edite apenas este arquivo para trocar imagens; nada disso aparece como campo no site.
 */

export interface SubscriptionPreset {
  id: string;
  label: string;
  /** Fallback quando `imageUrl` estiver vazio: https://logo.clearbit.com/<domain> */
  domain: string;
  /**
   * URL da imagem (absoluta ou relativa ao site, ex. /logos/netflix.png).
   * Deixe "" para usar só o Clearbit com `domain`.
   */
  imageUrl: string;
}

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { id: "netflix", label: "Netflix", domain: "netflix.com", imageUrl: "" },
  { id: "prime", label: "Prime Video", domain: "primevideo.com", imageUrl: "" },
  { id: "disney", label: "Disney+", domain: "disneyplus.com", imageUrl: "" },
  { id: "hbo", label: "HBO Max", domain: "hbomax.com", imageUrl: "" },
  { id: "crunchyroll", label: "Crunchyroll", domain: "crunchyroll.com", imageUrl: "" },
  { id: "spotify", label: "Spotify", domain: "spotify.com", imageUrl: "" },
  { id: "apple_music", label: "Apple Music", domain: "apple.com", imageUrl: "" },
  { id: "youtube", label: "YouTube Premium", domain: "youtube.com", imageUrl: "" },
  { id: "figma", label: "Figma", domain: "figma.com", imageUrl: "" },
  { id: "notion", label: "Notion", domain: "notion.so", imageUrl: "" },
  { id: "github", label: "GitHub", domain: "github.com", imageUrl: "" },
  { id: "openai", label: "ChatGPT Plus", domain: "openai.com", imageUrl: "" },
  { id: "adobe", label: "Adobe", domain: "adobe.com", imageUrl: "" },
  { id: "microsoft365", label: "Microsoft 365", domain: "microsoft.com", imageUrl: "" },
  { id: "dropbox", label: "Dropbox", domain: "dropbox.com", imageUrl: "" },
  { id: "icloud", label: "iCloud+", domain: "icloud.com", imageUrl: "" },
  { id: "nubank", label: "Nubank Ultravioleta", domain: "nubank.com.br", imageUrl: "" },
];

export function clearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export function getPresetById(id: string | null | undefined): SubscriptionPreset | undefined {
  if (!id) return undefined;
  return SUBSCRIPTION_PRESETS.find((p) => p.id === id);
}

/**
 * Logo a partir do preset (`iconKey`): `preset.imageUrl` neste ficheiro ou Clearbit por `domain`.
 */
export function resolveSubscriptionImageUrl(iconKey?: string | null): string {
  const preset = getPresetById(iconKey || undefined);
  if (!preset) return "";
  const manual = preset.imageUrl?.trim();
  if (manual) return manual;
  return clearbitLogoUrl(preset.domain);
}

/** Categorias só para UI (agrupamento / cores); não são persistidas na API. */
export type SubscriptionUiCategory =
  | "streaming"
  | "musica"
  | "jogos"
  | "software"
  | "noticias"
  | "saude"
  | "educacao"
  | "outros";

export const SUBSCRIPTION_CATEGORY_LABELS: Record<SubscriptionUiCategory, string> = {
  streaming: "Streaming",
  musica: "Música",
  jogos: "Jogos",
  software: "Software",
  noticias: "Notícias",
  saude: "Saúde",
  educacao: "Educação",
  outros: "Outros",
};

export const SUBSCRIPTION_CATEGORY_COLORS: Record<SubscriptionUiCategory, string> = {
  streaming: "#6366f1",
  musica: "#ec4899",
  jogos: "#f59e0b",
  software: "#06b6d4",
  noticias: "#64748b",
  saude: "#10b981",
  educacao: "#8b5cf6",
  outros: "#94a3b8",
};

/** Mapeia preset `iconKey` → categoria para resumos no dashboard de assinaturas. */
const ICON_KEY_TO_CATEGORY: Partial<Record<string, SubscriptionUiCategory>> = {
  netflix: "streaming",
  prime: "streaming",
  disney: "streaming",
  hbo: "streaming",
  crunchyroll: "streaming",
  spotify: "musica",
  apple_music: "musica",
  youtube: "musica",
  figma: "software",
  notion: "software",
  github: "software",
  openai: "software",
  adobe: "software",
  microsoft365: "software",
  dropbox: "software",
  icloud: "software",
  nubank: "outros",
};

export function getUiCategoryForIconKey(
  iconKey?: string | null
): SubscriptionUiCategory {
  const k = iconKey?.trim();
  if (k && ICON_KEY_TO_CATEGORY[k]) {
    return ICON_KEY_TO_CATEGORY[k]!;
  }
  return "outros";
}
