import { Request, Response, Router } from "express";

const router = Router();

/** Evita path traversal e valores inválidos; só host estilo FQDN. */
function sanitizeLogoDomain(raw: string): string | null {
  try {
    const decoded = decodeURIComponent(raw).trim().toLowerCase();
    if (!decoded || decoded.length > 253) return null;
    if (/[\s/\\]/.test(decoded) || decoded.includes("..")) return null;
    if (!decoded.includes(".")) return null;
    if (!/^[a-z0-9]/.test(decoded) || !/[a-z0-9]$/i.test(decoded)) return null;
    if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Proxy público para logos (img não envia Authorization).
 * Usa LOGO_DEV_API_KEY no servidor; fallback 302 → Clearbit.
 */
router.get("/:domain", async (req: Request, res: Response) => {
  const host = sanitizeLogoDomain(req.params.domain);
  if (!host) {
    return res.status(400).json({ error: "Domínio inválido" });
  }

  const key = process.env.LOGO_DEV_API_KEY?.trim();
  const clearbitUrl = `https://logo.clearbit.com/${encodeURIComponent(host)}`;

  if (!key) {
    return res.redirect(302, clearbitUrl);
  }

  try {
    const upstream = new URL(`https://img.logo.dev/${host}`);
    upstream.searchParams.set("token", key);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15_000);
    const r = await fetch(upstream.toString(), {
      headers: { Accept: "image/*,*/*" },
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!r.ok) {
      return res.redirect(302, clearbitUrl);
    }

    const ct = r.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e) {
    console.error("logo proxy:", e);
    return res.redirect(302, clearbitUrl);
  }
});

export default router;
