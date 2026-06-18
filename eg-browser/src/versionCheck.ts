const CHECK_INTERVAL_MS = 5 * 60 * 1000;

let bannerShown = false;

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

function showRefreshBanner() {
  if (bannerShown) return;
  bannerShown = true;

  const banner = document.createElement("div");
  banner.setAttribute("role", "alert");
  Object.assign(banner.style, {
    position: "fixed",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "99999",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    background: "#1f2937",
    color: "#f9fafb",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
    fontSize: "14px",
    fontFamily: "inherit",
  } satisfies Partial<CSSStyleDeclaration>);

  const text = document.createElement("span");
  text.textContent = "A new version of the browser is available.";

  const refreshButton = document.createElement("button");
  refreshButton.textContent = "Refresh";
  Object.assign(refreshButton.style, {
    padding: "4px 12px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  } satisfies Partial<CSSStyleDeclaration>);
  refreshButton.onclick = () => location.reload();

  const dismissButton = document.createElement("button");
  dismissButton.textContent = "×";
  dismissButton.setAttribute("aria-label", "Dismiss");
  Object.assign(dismissButton.style, {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: "1",
    padding: "0 2px",
  } satisfies Partial<CSSStyleDeclaration>);
  dismissButton.onclick = () => banner.remove();

  banner.append(text, refreshButton, dismissButton);
  document.body.appendChild(banner);
}

export function startVersionCheck() {
  if (import.meta.env.DEV) return;

  const check = async () => {
    const deployed = await fetchDeployedVersion();
    if (deployed && deployed !== __BUILD_VERSION__) {
      showRefreshBanner();
    }
  };

  setInterval(check, CHECK_INTERVAL_MS);
  // Returning to a long-idle tab is the most likely moment to be stale.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}
