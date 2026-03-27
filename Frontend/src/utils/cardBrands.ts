/**
 * Estilos visuais inspirados em fintechs/bancos brasileiros (cores aproximadas).
 * O campo `bank` salvo no cartão é comparado de forma flexível (acentos, caixa).
 */

export interface CardBrandStyle {
  id: string;
  label: string;
  /** Gradiente CSS para o plástico do cartão */
  gradient: string;
  /** Cor do texto sobre o cartão */
  textColor: string;
  /** Cor secundária (subtítulos) */
  subtextColor: string;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

export const CARD_BRAND_PRESETS: CardBrandStyle[] = [
  {
    id: "nubank",
    label: "Nubank",
    gradient:
      "linear-gradient(135deg, #820AD1 0%, #5B0A9A 45%, #3D0666 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.82)",
  },
  {
    id: "bb",
    label: "Banco do Brasil",
    gradient:
      "linear-gradient(125deg, #FEDD00 0%, #F5D000 28%, #003781 28.5%, #002966 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.88)",
  },
  {
    id: "bradesco",
    label: "Bradesco",
    gradient: "linear-gradient(135deg, #CC092F 0%, #8B061F 50%, #4A030F 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.85)",
  },
  {
    id: "santander",
    label: "Santander",
    gradient: "linear-gradient(135deg, #EC0000 0%, #B50000 55%, #7A0000 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.88)",
  },
  {
    id: "c6",
    label: "C6 Bank",
    gradient:
      "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #3d3d3d 70%, #1f3520 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.78)",
  },
  {
    id: "itau",
    label: "Itaú",
    gradient: "linear-gradient(135deg, #EC7000 0%, #C75F00 45%, #8F4400 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.9)",
  },
  {
    id: "inter",
    label: "Banco Inter",
    gradient:
      "linear-gradient(135deg, #FF7A00 0%, #FF8C1A 35%, #00A868 70%, #008F59 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.9)",
  },
  {
    id: "caixa",
    label: "Caixa",
    gradient: "linear-gradient(135deg, #003F7A 0%, #0066B3 50%, #004D85 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.88)",
  },
  {
    id: "picpay",
    label: "PicPay",
    gradient: "linear-gradient(135deg, #11C56E 0%, #0AA85E 45%, #067848 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.9)",
  },
  {
    id: "original",
    label: "Banco Original",
    gradient: "linear-gradient(135deg, #F4B942 0%, #D4A017 40%, #8B6914 100%)",
    textColor: "#1a1a1a",
    subtextColor: "rgba(0,0,0,0.65)",
  },
  {
    id: "default",
    label: "Outro",
    gradient:
      "linear-gradient(135deg, #2563EB 0%, #1D4ED8 45%, #1E293B 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.85)",
  },
];

const PRESET_BY_ID = new Map(CARD_BRAND_PRESETS.map((p) => [p.id, p]));

/** Resolve estilo a partir do texto salvo em `bank` (ex.: "Nubank", "nubank roxo") */
export function getCardBrandStyle(bank?: string | null): CardBrandStyle {
  if (!bank || !bank.trim()) {
    return PRESET_BY_ID.get("default")!;
  }
  const n = normalize(bank);

  for (const preset of CARD_BRAND_PRESETS) {
    if (preset.id === "default") continue;
    const pl = normalize(preset.label);
    if (n.includes(pl) || pl.includes(n) || n.includes(preset.id)) {
      return preset;
    }
  }

  if (n.includes("bb") || n.includes("banco do brasil")) {
    return PRESET_BY_ID.get("bb")!;
  }
  if (n.includes("c6")) {
    return PRESET_BY_ID.get("c6")!;
  }

  return PRESET_BY_ID.get("default")!;
}

/** Para o select do formulário: encontra preset pelo rótulo exato salvo no banco */
export function matchPresetByBankLabel(bank?: string | null): CardBrandStyle {
  if (!bank) return PRESET_BY_ID.get("default")!;
  const n = normalize(bank);
  const exact = CARD_BRAND_PRESETS.find((p) => normalize(p.label) === n);
  if (exact) return exact;
  return getCardBrandStyle(bank);
}
