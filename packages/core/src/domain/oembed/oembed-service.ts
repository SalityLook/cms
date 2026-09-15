import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { oembedCache } from "../../db/schema/oembed";
import { ValidationError } from "../../errors";

export interface OembedResult {
  url: string;
  providerName: string;
  html: string;
}

interface ProviderDefinition {
  name: string;
  hostPattern: RegExp;
  endpoint: (url: string) => string;
}

/**
 * Allowlist of known providers ONLY -- deliberately NOT open oEmbed
 * discovery against an arbitrary domain (which would mean trusting
 * whatever HTML any site on the internet wants to hand back). Every
 * provider here returns a plain <iframe>-based embed in normal operation;
 * Twitter/X (blockquote+script-tag embeds, needing platform.js loaded)
 * is deliberately excluded for that reason -- allowing it would mean
 * either trusting a third-party script wholesale or stripping the
 * <script> tag and breaking the embed outright, neither of which fits
 * "iframe-only, sanitize what's stored" cleanly.
 */
const PROVIDERS: ProviderDefinition[] = [
  {
    name: "YouTube",
    hostPattern: /^(https?:\/\/)?(www\.)?(youtube\.com\/watch|youtu\.be\/)/i,
    endpoint: (url) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  },
  {
    name: "Vimeo",
    hostPattern: /^(https?:\/\/)?(www\.)?vimeo\.com\//i,
    endpoint: (url) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  },
  {
    name: "SoundCloud",
    hostPattern: /^(https?:\/\/)?(www\.)?soundcloud\.com\//i,
    endpoint: (url) => `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
  },
  {
    name: "CodePen",
    hostPattern: /^(https?:\/\/)?(www\.)?codepen\.io\//i,
    endpoint: (url) => `https://codepen.io/api/oembed?format=json&url=${encodeURIComponent(url)}`
  }
];

export function matchProvider(url: string): ProviderDefinition | null {
  return PROVIDERS.find((p) => p.hostPattern.test(url)) ?? null;
}

/**
 * Strips <script>...</script> and inline event-handler attributes
 * (onload=, onerror=, etc.) before the HTML is ever stored -- exercised
 * directly by a real negative test (a mocked provider response containing
 * a literal <script>alert(1)</script>), not just assumed safe because the
 * allowlisted providers "shouldn't" return one.
 */
export function sanitizeEmbedHtml(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
}

export class OembedService {
  constructor(private readonly db: Database) {}

  async resolve(url: string): Promise<OembedResult> {
    const cached = await this.db.query.oembedCache.findFirst({ where: eq(oembedCache.url, url) });
    if (cached) {
      return { url, providerName: cached.providerName, html: cached.html };
    }

    const provider = matchProvider(url);
    if (!provider) {
      throw new ValidationError("Unsupported embed provider");
    }

    const response = await fetch(provider.endpoint(url));
    if (!response.ok) {
      throw new ValidationError("Failed to resolve embed for this URL");
    }
    const data = (await response.json()) as { html?: string };
    if (!data.html) {
      throw new ValidationError("Provider did not return embeddable HTML");
    }

    const html = sanitizeEmbedHtml(data.html);
    await this.db.insert(oembedCache).values({ url, providerName: provider.name, html }).onConflictDoNothing();

    return { url, providerName: provider.name, html };
  }
}
