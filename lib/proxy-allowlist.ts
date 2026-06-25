/**
 * Host allowlist for the server-side media/JSON proxies (`/api/proxy-video`,
 * `/api/proxy-json`).
 *
 * These proxies fetch a caller-supplied URL. Without restriction that is a
 * Server-Side Request Forgery (SSRF) hole: a caller could point the server at
 * internal services (e.g. cloud metadata endpoints, localhost admin panels).
 *
 * We only ever need to proxy assets stored on Backblaze B2, so we restrict the
 * target host to Backblaze domains. Extra hosts can be allow-listed at runtime
 * via the `PROXY_ALLOWED_HOSTS` env var (comma-separated) without a code change.
 */

const ALLOWED_HOST_SUFFIXES = [".backblazeb2.com"]
const ALLOWED_HOSTS_EXACT = ["backblazeb2.com"]

function extraAllowedHosts(): string[] {
  return (process.env.PROXY_ALLOWED_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Returns true only when `rawUrl` is a well-formed http(s) URL whose host is on
 * the allowlist. Everything else (relative URLs, other schemes, internal hosts,
 * IP literals) is rejected.
 */
export function isAllowedProxyUrl(rawUrl: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false
  }

  const host = parsed.hostname.toLowerCase()

  if (extraAllowedHosts().includes(host)) return true
  if (ALLOWED_HOSTS_EXACT.includes(host)) return true
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}
