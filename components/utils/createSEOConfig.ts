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

const isProduction =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

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
  const site = (
    canonicalUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.syncc.org"
  ).replace(/\/$/, ""); // ensure absolute base
  const localePrefix: Record<string, string> = {
    ar: "",
    en: "/en",
  };

  const pathNormalized = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  // Ensure we don't end up with double slashes when path is '/'
  const canonicalFull = `${site}${localePrefix[locale] ?? ""}${
    pathNormalized === "/" ? "" : pathNormalized
  }`;

  return {
    title: title || currentSEO.title,
    description: description || currentSEO.description,
    titleTemplate: `%s | ${currentSEO.siteName}`,
    defaultTitle: currentSEO.siteName,
    // Allow indexing in production; block only in non-production
    dangerouslySetAllPagesToNoFollow: false,
    dangerouslySetAllPagesToNoIndex: false,
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
    // twitter: {
    //   handle: (currentSEO as any).twitterHandle,
    //   site: (currentSEO as any).twitterHandle,
    //   cardType: (currentSEO as any).twitterCardType,
    // },
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
      {
        name: "viewport",
        // Allow user zoom for accessibility; remove user-scalable=no & high max-scale block
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "coverage",
        content: "worldwide",
      },
      {
        name: "robots",
        content: "index,follow",
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
      ...Object.keys(seoContent).map((l) => ({
        rel: "alternate",
        hrefLang: l,
        href: `${site}${localePrefix[l] ?? ""}${
          pathNormalized === "/" ? "" : pathNormalized
        }`,
      })),
      // x-default points to root (no locale prefix) as global fallback
      ...(site
        ? [
            {
              rel: "alternate",
              hrefLang: "x-default",
              href: `${site}${pathNormalized === "/" ? "" : pathNormalized}`,
            },
          ]
        : []),
    ],
  };
}
