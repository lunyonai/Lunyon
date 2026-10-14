const BLOCKED_TAGS =
  /<\/?(?:script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|svg|math|video|audio|source|track|frame|frameset)(?:\s[\s\S]*?)?>/gi;

const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URL = /(?:javascript|vbscript|data):/gi;

export function sanitizeGmailHtml(html: string): string {
  let out = html
    .replace(BLOCKED_TAGS, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(EVENT_ATTR, "")
    .replace(/\s+(?:href|src|xlink:href|action|formaction)\s*=\s*(["'])\s*(?:javascript|vbscript|data):[\s\S]*?\1/gi, "")
    .replace(DANGEROUS_URL, "");

  out = out.replace(/<a\b([^>]*)>/gi, (_all, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    const href = hrefMatch?.[2]?.trim() ?? "";
    const safe =
      href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:");
    const next = safe ? href : "#";
    return `<a href="${next.replace(/"/g, "")}" rel="noreferrer noopener" target="_blank">`;
  });

  return out.slice(0, 200_000);
}
