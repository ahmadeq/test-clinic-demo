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

const localePrefix: Record<string, string> = {
  ar: "",
  en: "/en",
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

  const site = (
    canonicalUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.syncc.org"
  ).replace(/\/$/, "");

  const rawPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const sanitizedPath = rawPath.split(/[?#]/)[0] || "";
  const localePattern = new RegExp(
    `^/(${supportedLocales.join("|")})(?=$|/)`,
    "i"
  );
  const pathWithoutLocale = sanitizedPath.replace(localePattern, "") || "/";
  const normalizedPath =
    !pathWithoutLocale || pathWithoutLocale === "/" ? "" : pathWithoutLocale;

  const canonicalFull = `${site}${localePrefix[locale] ?? ""}${normalizedPath}`;

  return {
    title: title || currentSEO.title,
    description: description || currentSEO.description,
    titleTemplate: `%s | ${currentSEO.siteName}`,
    defaultTitle: currentSEO.siteName,
    dangerouslySetAllPagesToNoFollow: !isProduction,
    dangerouslySetAllPagesToNoIndex: !isProduction,
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
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "coverage",
        content: "worldwide",
      },
      {
        name: "robots",
        content: isProduction ? "index,follow" : "noindex,nofollow",
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
    additionalLinkTags: [
      ...supportedLocales.map((language) => {
        const prefix = localePrefix[language] ?? `/${language}`;
        return {
          rel: "alternate",
          hrefLang: language,
          href: `${site}${prefix}${normalizedPath}`,
        };
      }),
      {
        rel: "alternate",
        hrefLang: "x-default",
        href: `${site}${normalizedPath}`,
      },
    ],
  };
}
