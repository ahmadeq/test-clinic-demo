import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import { Inter, Cairo } from "next/font/google";
import useLang from "@/components/hooks/useLang";
import { createSEOConfig } from "@/components/utils/createSEOConfig";
import { useRouter } from "next/router";
import { TailwindIndicator } from "@/components/utils/TailwindIndicator";
import { Toaster } from "@/components/ui/sonner";

// Font configurations
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

function FontWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();

  const fontClass = lang === "ar" ? cairo.className : inter.className;

  return <div className={fontClass}>{children}</div>;
}

export default function App({ Component, pageProps }: AppProps) {
  const { lang } = useLang();
  const router = useRouter();

  const seoConfig = createSEOConfig({
    locale: lang,
    canonicalUrl: process.env.NEXT_PUBLIC_SITE_URL,
    path: router.asPath,
  });

  return (
    <>
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
          --font-cairo: ${cairo.style.fontFamily};
        }
      `}</style>

      <DefaultSeo {...seoConfig} />

      <FontWrapper>
        <Component {...pageProps} />
        <Toaster />
        <TailwindIndicator />
      </FontWrapper>
    </>
  );
}
