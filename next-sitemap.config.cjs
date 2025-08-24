/**
 * next-sitemap configuration (CommonJS)
 * Uses NEXT_PUBLIC_SITE_URL for site URL. Locales are hardcoded to match i18n.js
 */
const locales = ["ar", "en"];
const defaultLocale = "ar";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_URL ||
  "https://byeq.net";

// Paths to exclude from sitemap
const exclude = ["/404", "/401", "/500", "/403"];

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  exclude,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: "*",
        disallow: ["/404", "/401", "/500", "/403"],
      },
    ],
    // additionalSitemaps removed: referenced sitemap files aren't in this repo
  },
  transform: async (config, path) => {
    const links = locales.map((locale) => {
      const prefix = locale === defaultLocale ? "" : `/${locale}`;
      return {
        lang: locale,
        url: `${config.siteUrl}${prefix}${path}`,
      };
    });

    return {
      loc: `${config.siteUrl}${path}`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: new Date().toISOString(),
      alternates: links,
    };
  },
};
