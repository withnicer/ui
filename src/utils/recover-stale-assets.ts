/** Reload once when a tab from a previous release requests a removed lazy chunk. */
export const recoverStaleAssets = (): void => {
  window.addEventListener("vite:preloadError", (event) => {
    const key = "nicer:asset-reload-at";
    try {
      const previous = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - previous < 60_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      return; // Do not risk a reload loop if storage is unavailable.
    }
    event.preventDefault();
    window.location.reload();
  });
};
