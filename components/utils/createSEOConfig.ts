import { NextSeoProps } from "next-seo";
import { UserDefaultImage } from "../constants/default_data";
import arSEO from "@/locales/ar/seo.json";
import enSEO from "@/locales/en/seo.json";

const seoContent = {
  ar: arSEO,
  en: enSEO,
};

const supportedLocales = Object.keys(seoContent) as Array<
  keyof typeof seoContent
>;

const defaultLocale = "ar" as keyof typeof seoContent;

const normalizePath = (input?: string): string => {
  if (!input) {
    return "/";
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutSearchOrHash = withLeadingSlash.split(/[?#]/)[0] || "/";
  const collapsed = withoutSearchOrHash.replace(/\/+/g, "/") || "/";

  if (collapsed !== "/" && collapsed.endsWith("/")) {
    return collapsed.replace(/\/+$/, "");
  }

  return collapsed || "/";
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
  const normalizedSite = site.replace(/\/+$/, "");
  const localePrefix: Record<string, string> = {
    ar: "",
    en: "/en",
  };

  const pathNormalized = normalizePath(path);
  const localePattern = new RegExp(
    `^/(${supportedLocales.join("|")})(?=$|/)`,
    "i"
  );
  const pathWithoutLocale = pathNormalized.replace(localePattern, "") || "/";
  const basePath = pathWithoutLocale === "" ? "/" : pathWithoutLocale;

  const canonicalPath =
    locale === defaultLocale
      ? basePath
      : `${localePrefix[locale] ?? `/${locale}`}${
          basePath === "/" ? "" : basePath
        }`;
  const canonicalPathNormalized =
    canonicalPath === "/" ? "/" : canonicalPath.replace(/\/+/g, "/");
  const canonicalPathClean =
    canonicalPathNormalized !== "/" && canonicalPathNormalized.endsWith("/")
      ? canonicalPathNormalized.replace(/\/+$/, "")
      : canonicalPathNormalized || "/";
  const canonicalFull = normalizedSite
    ? new URL(canonicalPathClean, `${normalizedSite}/`).toString()
    : undefined;

  const alternateLinks = normalizedSite
    ? supportedLocales.map((supportedLocale) => {
        const isDefaultLocale = supportedLocale === defaultLocale;
        const prefix = localePrefix[supportedLocale] ?? `/${supportedLocale}`;
        const rawAlternatePath =
          basePath === "/"
            ? isDefaultLocale
              ? "/"
              : prefix || "/"
            : `${isDefaultLocale ? "" : prefix}${basePath}`;
        const alternatePathNormalized =
          rawAlternatePath === "/"
            ? "/"
            : rawAlternatePath.replace(/\/+/g, "/");
        const alternatePathClean =
          alternatePathNormalized !== "/" &&
          alternatePathNormalized.endsWith("/")
            ? alternatePathNormalized.replace(/\/+$/, "")
            : alternatePathNormalized || "/";

        return {
          rel: "alternate",
          hrefLang: supportedLocale,
          href: new URL(alternatePathClean, `${normalizedSite}/`).toString(),
        };
      })
    : [];

  const xDefaultHref = normalizedSite
    ? new URL(
        basePath === "/" ? "/" : basePath,
        `${normalizedSite}/`
      ).toString()
    : undefined;

  return {
    title: title || currentSEO.title,
    description: description || currentSEO.description,
    titleTemplate: `%s | ${currentSEO.siteName}`,
    defaultTitle: currentSEO.siteName,
    // In non-production environments or when explicitly disabled, prevent indexing
    dangerouslySetAllPagesToNoFollow: disableIndexing,
    dangerouslySetAllPagesToNoIndex: disableIndexing,
    // per-page canonical (includes locale prefix and page path when provided)
    canonical: canonicalFull,
    openGraph: {
      type: "website",
      locale: currentSEO.locale,
      url: canonicalFull,
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
    additionalMetaTags: [
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
      // Viewport is defined once in _document.tsx for consistency and performance
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
    ],
    // Add hreflang alternate links for supported locales.
    additionalLinkTags: [
      ...alternateLinks,
      ...(xDefaultHref
        ? [
            {
              rel: "alternate",
              hrefLang: "x-default",
              href: xDefaultHref,
            },
          ]
        : []),
    ],
  };
}
