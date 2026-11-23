import { useEffect, useEffectEvent, useState } from "react";

import { isPlaceholderPixel } from "./image-fallbacks";

/**
 * The photo once it loaded as a real image, for a CSS background — which has
 * no `error` to fall back on and paints the proxy's pixel as a solid block.
 * Nothing while it loads or when it failed, so the element keeps its own
 * background; `onBroken` hears of a photo that failed or came back as the
 * proxy's pixel.
 */
export const useLoadedImage = (
  src?: string,
  onBroken?: () => void
): string | undefined => {
  const [loaded, setLoaded] = useState<string>();
  const reportBroken = useEffectEvent(() => onBroken?.());

  useEffect(() => {
    if (!src) {
      return undefined;
    }
    let current = true;
    const probe = new Image();
    probe.onload = () => {
      if (!current) {
        return;
      }
      if (isPlaceholderPixel(probe)) {
        reportBroken();
      } else {
        setLoaded(src);
      }
    };
    probe.onerror = () => {
      if (current) {
        reportBroken();
      }
    };
    probe.src = src;
    return () => {
      current = false;
    };
  }, [src]);

  return src && loaded === src ? src : undefined;
};
