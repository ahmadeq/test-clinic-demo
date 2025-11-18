import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import { useEffect } from "react";
import useLang from "@/components/hooks/useLang";
import { createSEOConfig } from "@/components/utils/createSEOConfig";
import { useRouter } from "next/router";
import { TailwindIndicator } from "@/components/utils/TailwindIndicator";
import { ClinicProvider } from "@/components/context/ClinicContext";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false }
);

// Initialize fonts at module scope (required by next/font)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const madani = localFont({
  variable: "--font-madani",
  display: "swap",
  src: [
    {
      path: "../fonts/madani/extraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/madani/light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/madani/regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/madani/medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/madani/semiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/madani/bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/madani/extraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
});

export default function App({ Component, pageProps }: AppProps) {
  const { lang, isArabic } = useLang();
  const router = useRouter();

  const seoConfig = createSEOConfig({
    locale: lang,
    canonicalUrl: process.env.NEXT_PUBLIC_SITE_URL,
    path: router.asPath,
  });

  // Ensure <html dir> and lang update instantly on client when language toggles (no full refresh needed)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", isArabic ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", lang);
    }
  }, [isArabic, lang]);

  return (
    <>
      <DefaultSeo {...seoConfig} />
      <ClinicProvider>
        <div
          className={`${inter.variable} ${madani.variable} ${
            lang === "ar" ? madani.className : inter.className
          }`}
        >
          <Component {...pageProps} />
          <Toaster />
          <TailwindIndicator />
        </div>
      </ClinicProvider>
    </>
  );
}
