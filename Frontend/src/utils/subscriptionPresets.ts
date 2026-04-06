/**
 * Logos das assinaturas — cadastre as URLs AQUI no código.
 *
 * Para cada serviço você pode:
 * - Preencher `imageUrl` com URL absoluta (https://...) ou caminho em `public/`
 *   (ex.: "/logos/netflix.png" após colocar o arquivo em Frontend/public/logos/).
 * - Deixar `imageUrl` vazio: usa o proxy do backend `GET /api/logos/:domain`
 *   (logo.dev com `LOGO_DEV_API_KEY` no .env do servidor; sem chave, o proxy redireciona ao Clearbit).
 *
 * Edite apenas este arquivo para trocar imagens; nada disso aparece como campo no site.
 */

import { API_BASE_URL } from "./api";

export interface SubscriptionPreset {
  id: string;
  label: string;
  /** Domínio do serviço (ex. netflix.com) — usado na URL do logo.dev ou Clearbit. */
  domain: string;
  /**
   * URL da imagem (absoluta ou relativa ao site, ex. /logos/netflix.png).
   * Deixe "" para usar o proxy `/api/logos/<domain>` na API.
   */
  imageUrl: string;
}

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { id: "netflix", label: "Netflix", domain: "netflix.com", imageUrl: "https://img.logo.dev/netflix.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "prime", label: "Prime Video", domain: "primevideo.com", imageUrl: "https://img.logo.dev/primevideo.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "disney", label: "Disney+", domain: "disneyplus.com", imageUrl: "https://img.logo.dev/disneyplus.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "hbo", label: "HBO Max", domain: "hbomax.com", imageUrl: "https://img.logo.dev/hbomax.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "crunchyroll", label: "Crunchyroll", domain: "crunchyroll.com", imageUrl: "https://img.logo.dev/crunchyroll.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "spotify", label: "Spotify", domain: "spotify.com", imageUrl: "https://img.logo.dev/spotify.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "apple_music", label: "Apple Music", domain: "apple.com", imageUrl: "https://img.logo.dev/apple.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "youtube", label: "YouTube Premium", domain: "youtube.com", imageUrl: "https://img.logo.dev/youtube.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "figma", label: "Figma", domain: "figma.com", imageUrl: "https://img.logo.dev/figma.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "notion", label: "Notion", domain: "notion.so", imageUrl: "https://img.logo.dev/notion.so?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "github", label: "GitHub", domain: "github.com", imageUrl: "https://img.logo.dev/github.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "openai", label: "ChatGPT Plus", domain: "openai.com", imageUrl: "https://img.logo.dev/openai.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true " },
  { id: "adobe", label: "Adobe", domain: "adobe.com", imageUrl: "https://img.logo.dev/adobe.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "microsoft365", label: "Microsoft 365", domain: "microsoft.com", imageUrl: "https://img.logo.dev/microsoft.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "dropbox", label: "Dropbox", domain: "dropbox.com", imageUrl: "https://img.logo.dev/dropbox.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "icloud", label: "iCloud+", domain: "icloud.com", imageUrl: "https://img.logo.dev/icloud.com?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
  { id: "nubank", label: "Nubank Ultravioleta", domain: "nubank.com.br", imageUrl: "https://img.logo.dev/nubank.com.br?token=pk_FaCM1kESRGiHHvygNfASgA&size=80&retina=true" },
];

export function clearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${normalizeLogoDomain(domain)}`;
}

/** Domínio limpo para APIs de logo (sem protocolo / path). */
export function normalizeLogoDomain(domain: string): string {
  const t = domain.trim();
  if (!t) return "";
  return t
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.split("?")[0]
    ?.toLowerCase() ?? "";
}

/**
 * URL da imagem via backend (mesma base que o restante da API): proxy logo.dev + fallback Clearbit.
 */
export function backendSubscriptionLogoUrl(domain: string): string {
  const host = normalizeLogoDomain(domain);
  if (!host) return "";
  const base = (API_BASE_URL ?? "").replace(/\/$/, "");
  if (!base) return clearbitLogoUrl(domain);
  return `${base}/api/logos/${encodeURIComponent(host)}`;
}

/** Logo automático por domínio: proxy na API ou Clearbit direto se não houver base. */
export function defaultLogoUrlForDomain(domain: string): string {
  return backendSubscriptionLogoUrl(domain);
}

export function getPresetById(id: string | null | undefined): SubscriptionPreset | undefined {
  if (!id) return undefined;
  return SUBSCRIPTION_PRESETS.find((p) => p.id === id);
}

/**
 * Logo a partir do preset (`iconKey`): `preset.imageUrl`, senão proxy `/api/logos` ou Clearbit.
 */
export function resolveSubscriptionImageUrl(iconKey?: string | null): string {
  const preset = getPresetById(iconKey || undefined);
  if (!preset) return "";
  const manual = preset.imageUrl?.trim();
  if (manual) return manual;
  return defaultLogoUrlForDomain(preset.domain);
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
