"use client";

import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import useLang from "../hooks/useLang";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "buttons" | "dropdown" | "flags";
}

export function LanguageSwitcher({
  className = "",
  variant = "buttons",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { lang, isArabic } = useLang();

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  if (variant === "dropdown") {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={lang}
          onChange={(e) => changeLanguage(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === "flags") {
    return (
      <div className={`flex space-x-2 ${className}`}>
        <button
          onClick={() => changeLanguage("ar")}
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isArabic
              ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="العربية"
        >
          <span className="text-lg mr-2">🇸🇦</span>
          <span className="text-sm font-medium">العربية</span>
        </button>
        <button
          onClick={() => changeLanguage("en")}
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            !isArabic
              ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="English"
        >
          <span className="text-lg mr-2">🇺🇸</span>
          <span className="text-sm font-medium">English</span>
        </button>
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={() => changeLanguage("ar")}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isArabic
            ? "bg-blue-500 text-white shadow-md"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {t("arabic")}
      </button>
      <button
        onClick={() => changeLanguage("en")}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          !isArabic
            ? "bg-green-500 text-white shadow-md"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {t("english")}
      </button>
    </div>
  );
}

// Alternative compact version
export function LanguageToggle({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { lang, isArabic } = useLang();

  const toggleLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isArabic ? "bg-blue-600" : "bg-gray-200"
      } ${className}`}
    >
      <span className="sr-only">Toggle language</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          isArabic ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span
        className={`absolute text-xs font-bold ${
          isArabic ? "left-1 text-white" : "right-1 text-gray-600"
        }`}
      >
        {lang.toUpperCase()}
      </span>
    </button>
  );
}
