import { NextSeoProps } from "next-seo";
import { UserDefaultImage } from "../constants/default_data";
import arSEO from "@/locales/ar/seo.json";
import enSEO from "@/locales/en/seo.json";

const seoContent = {
  ar: arSEO,
  en: enSEO,
};

type SeoConfigType = {
  canonicalUrl?: string;
  locale?: "ar" | "en";
  path?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
};

export interface SEOProps extends NextSeoProps {
  dangerouslySetAllPagesToNoFollow?: boolean;
  dangerouslySetAllPagesToNoIndex?: boolean;
}

// Determine if we are in production. Prefer NODE_ENV, but also honor Vercel env var.
// const isProduction =
//   process.env.NODE_ENV === "production" ||
//   process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

const isProduction = true; // --- IGNORE ---

// Optional override to disable indexing across environments
// Set NEXT_PUBLIC_DISABLE_INDEXING="true" to force noindex/nofollow.
// const disableIndexing =
//   process.env.NEXT_PUBLIC_DISABLE_INDEXING === "true" || !isProduction;

const disableIndexing = false; // --- IGNORE ---

export function createSEOConfig({
  canonicalUrl,
  locale = "ar",
  path,
  title,
  description,
  ogImage,
  ogTitle,
  ogDescription,
}: SeoConfigType): SEOProps {
  const currentSEO = seoContent[locale];

  // site and path handling for per-page canonical and hreflang
  const site = canonicalUrl || "";
  const localePrefix: Record<string, string> = {
    ar: "",
    en: "/en",
  };

  const pathNormalized = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const canonicalFull = `${site}${localePrefix[locale] ?? ""}${pathNormalized}`;

  return {
    title: title || currentSEO.title,
    description: description || currentSEO.description,
    titleTemplate: `%s - ${currentSEO.siteName}`,
    defaultTitle: currentSEO.siteName,
  // In non-production environments or when explicitly disabled, prevent indexing
  dangerouslySetAllPagesToNoFollow: disableIndexing,
  dangerouslySetAllPagesToNoIndex: disableIndexing,
    // per-page canonical (includes locale prefix and page path when provided)
    canonical: canonicalFull || undefined,
    openGraph: {
      type: "website",
      locale: currentSEO.locale,
      url: canonicalFull || undefined,
      title: ogTitle || title || currentSEO.title,
      description: ogDescription || description || currentSEO.description,
      images: [
        {
          url: ogImage || UserDefaultImage,
          width: 1200,
          height: 630,
          alt: ogTitle || title || currentSEO.siteName,
        },
      ],
      site_name: currentSEO.siteName,
    },
    twitter: {
      handle: currentSEO.twitterHandle,
      site: currentSEO.twitterHandle,
      cardType: currentSEO.twitterCardType,
    },
    additionalMetaTags: [
      {
        property: "fb:pages",
        content: currentSEO.facebookPage,
      },
      {
        name: "Distribution",
        content: "Global",
      },
      {
        name: "Rating",
        content: "General",
      },
      {
        name: "theme-color",
        content: "#fff",
      },
      {
        name: "viewport",
  // Allow user zoom and avoid restrictive maximum-scale/user-scalable flags for accessibility
  content: "width=device-width, initial-scale=1",
      },
      {
        name: "coverage",
        content: "worldwide",
      },
      {
        name: "author",
        content: currentSEO.author,
      },
      {
        name: "keywords",
        content: currentSEO.keywords,
      },
      {
        content: "IE=edge",
        httpEquiv: "x-ua-compatible",
      },
      {
        name: "geo.country",
        content: currentSEO.geoCountry,
      },
      {
        name: "geo.placename",
        content: currentSEO.geoPlacename,
      },
      {
        name: "og:locale:alternate",
        content: currentSEO.ogLocaleAlternate,
      },
      {
        name: "audience",
        content: "all",
      },
      {
        name: "generator",
        content: "blogger",
      },
      {
        name: "revisit",
        content: "5 days",
      },
      {
        name: "revisit-after",
        content: "5 days",
      },
      {
        name: "document",
        content: "resource-type",
      },
      {
        name: "msvalidate.01",
        content: currentSEO.msvalidate,
      },
    ],
    // Add hreflang alternate links for supported locales.
    additionalLinkTags: Object.keys(seoContent).map((l) => ({
      rel: "alternate",
      hrefLang: l,
      href: `${site}${localePrefix[l] ?? ""}${pathNormalized}`,
    })),
  };
}
