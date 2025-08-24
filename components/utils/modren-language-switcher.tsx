"use client";

import { useRouter } from "next/router";
import useLang from "../hooks/useLang";
import { Globe, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ModernLanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "dropdown" | "minimal" | "card" | "toggle";
  size?: "sm" | "md" | "lg";
}

export function ModernLanguageSwitcher({
  className = "",
  variant = "pill",
  size = "md",
}: ModernLanguageSwitcherProps) {
  const router = useRouter();
  const { lang, isArabic } = useLang();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  // Pill variant - Modern rounded buttons
  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 ${className}`}
      >
        <button
          onClick={() => changeLanguage("ar")}
          className={`${
            sizeClasses[size]
          } rounded-full font-medium transition-all duration-200 ${
            isArabic
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          العربية
        </button>
        <button
          onClick={() => changeLanguage("en")}
          className={`${
            sizeClasses[size]
          } rounded-full font-medium transition-all duration-200 ${
            !isArabic
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          English
        </button>
      </div>
    );
  }

  // Dropdown variant - Professional dropdown
  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${sizeClasses[size]} inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        >
          <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {isArabic ? "العربية" : "English"}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <button
              onClick={() => changeLanguage("ar")}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                isArabic
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-white"
              } rounded-t-lg`}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-red-500 flex-shrink-0"></div>
                <span className="font-medium">العربية</span>
              </div>
            </button>
            <button
              onClick={() => changeLanguage("en")}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                !isArabic
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-white"
              } rounded-b-lg`}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-red-500 flex-shrink-0"></div>
                <span className="font-medium">English</span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Minimal variant - Clean and simple
  if (variant === "minimal") {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <button
          onClick={() => changeLanguage("ar")}
          className={`${
            sizeClasses[size]
          } font-medium transition-all duration-200 border-b-2 ${
            isArabic
              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          عربي
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          onClick={() => changeLanguage("en")}
          className={`${
            sizeClasses[size]
          } font-medium transition-all duration-200 border-b-2 ${
            !isArabic
              ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  // Card variant - Elegant card-style buttons
  if (variant === "card") {
    return (
      <div className={`inline-flex gap-2 ${className}`}>
        <button
          onClick={() => changeLanguage("ar")}
          className={`${
            sizeClasses[size]
          } bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isArabic
              ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-red-500"></div>
            <span className="font-medium">العربية</span>
          </div>
        </button>
        <button
          onClick={() => changeLanguage("en")}
          className={`${
            sizeClasses[size]
          } bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            !isArabic
              ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-red-500"></div>
            <span className="font-medium">English</span>
          </div>
        </button>
      </div>
    );
  }

  // Toggle variant - Modern toggle switch
  if (variant === "toggle") {
    return (
      <button
        onClick={() => changeLanguage(isArabic ? "en" : "ar")}
        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isArabic ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        } ${className}`}
      >
        <span className="sr-only">Toggle language</span>
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
            isArabic ? "translate-x-9" : "translate-x-1"
          }`}
        />
        <span
          className={`absolute text-xs font-bold transition-all duration-200 ${
            isArabic
              ? "left-1.5 text-white"
              : "right-1.5 text-gray-600 dark:text-gray-300"
          }`}
        >
          {isArabic ? "ع" : "EN"}
        </span>
      </button>
    );
  }

  return null;
}

// Compact globe icon variant
export function GlobeLanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const { lang, isArabic } = useLang();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Change language"
      >
        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <button
            onClick={() => changeLanguage("ar")}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
              isArabic
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "text-gray-900 dark:text-white"
            } rounded-t-lg text-sm`}
          >
            العربية
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
              !isArabic
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "text-gray-900 dark:text-white"
            } rounded-b-lg text-sm`}
          >
            English
          </button>
        </div>
      )}
    </div>
  );
}
