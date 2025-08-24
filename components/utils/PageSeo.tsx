import React from "react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import useLang from "@/components/hooks/useLang";
import { createSEOConfig } from "@/components/utils/createSEOConfig";

type PageSeoProps = {
  title?: string;
  description?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  // optional override for canonical path (defaults to router.asPath)
  canonicalPath?: string;
};

export default function PageSeo({
  title,
  description,
  ogImage,
  ogTitle,
  ogDescription,
  canonicalPath,
}: PageSeoProps) {
  const router = useRouter();
  const { lang } = useLang();

  const path = canonicalPath ?? router.asPath ?? "/";

  const seoProps = createSEOConfig({
    canonicalUrl: process.env.NEXT_PUBLIC_SITE_URL,
    locale: lang,
    path,
    title,
    description,
    ogImage,
    ogTitle,
    ogDescription,
  });

  return <NextSeo {...seoProps} />;
}
