import {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from "next/document";

interface DocumentProps extends DocumentInitialProps {
  __NEXT_DATA__: {
    locale?: string;
  };
}

export default function Document(props: DocumentProps) {
  const locale = props.__NEXT_DATA__.locale || "ar";
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <Html lang={locale} dir={direction}>
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await ctx.defaultGetInitialProps(ctx);
  return { ...initialProps };
};
