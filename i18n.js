module.exports = {
  locales: ["ar", "en"],
  defaultLocale: "en",
  pages: {
    "*": ["common"],
    "/": ["home"],
    "/hello": ["home"],
  },
  loadLocaleFrom: (lang, ns) =>
    import(`./locales/${lang}/${ns}.json`).then((m) => m.default),
};
