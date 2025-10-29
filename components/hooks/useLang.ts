import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

export type ILangType = "ar" | "en";

function useLang() {
  const router = useRouter();
  const { lang: translationLang } = useTranslation();

  const normalizedTranslationLang =
    translationLang === "ar" || translationLang === "en"
      ? (translationLang as ILangType)
      : undefined;

  const { locale, defaultLocale } = router;
  const routerLocale = (locale ?? defaultLocale ?? "ar") as ILangType;

  const resolvedLocale = normalizedTranslationLang ?? routerLocale;

  const lang: ILangType = resolvedLocale === "ar" ? "ar" : "en";
  const isArabic = lang === "ar";
  const dir: "ltr" | "rtl" = isArabic ? "rtl" : "ltr";
  return { isArabic, lang, dir } as const;
}

export default useLang;
