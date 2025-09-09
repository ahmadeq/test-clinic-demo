import { useEffect, useState } from "react";

type ScreenSizeResult = {
  screensize: number;
  isMobile: boolean;
  isLargeScreen: boolean;
  isExtraLargeScreen: boolean;
};

/**
 * Hook to read the current window width and a mobile boolean (width < 768).
 * Safe for SSR: returns a sensible default width on the server.
 */
function useScreenSize(): ScreenSizeResult {
  const getInitialWidth = () =>
    typeof window !== "undefined" ? window.innerWidth : 1024;

  const [width, setWidth] = useState<number>(getInitialWidth);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", onResize);
    // run once to ensure correct value
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = width < 768;
  const isLargeScreen = width >= 1280;
  const isExtraLargeScreen = width >= 1636;

  return { screensize: width, isMobile, isLargeScreen, isExtraLargeScreen } as const;
}

export default useScreenSize;
