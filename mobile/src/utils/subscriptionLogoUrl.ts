import { getApiBaseUrl } from "../config/env";

/**
 * URL da imagem de assinatura (mesmo proxy do web): backend `/api/logos/:domain`.
 * Use com `<Image source={{ uri: subscriptionLogoUrl("netflix.com") }} />`.
 */
export function subscriptionLogoUrl(domain: string): string {
  const t = domain.trim().toLowerCase();
  if (!t) return "";
  const host = t
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.split("?")[0];
  if (!host) return "";
  const base = getApiBaseUrl().replace(/\/$/, "");
  return `${base}/api/logos/${encodeURIComponent(host)}`;
}
