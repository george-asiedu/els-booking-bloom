import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { apiRequest, maybeResolveCustomDomain } from "@/lib/apiClient";
import { loadPlatformConfig, type PublicPlatformConfig } from "@/config/platform";

// Before the first render (both behind the loading screen):
//  - on a studio's custom domain, resolve which studio it is, so every
//    request is scoped correctly (no-op elsewhere);
//  - load the platform's name, contact details and prices set in the
//    platform console (capped at 2.5s; falls back to the last values seen).
Promise.allSettled([
  maybeResolveCustomDomain(),
  loadPlatformConfig(async () =>
    (await apiRequest<{ data: PublicPlatformConfig }>("/platform/public-config")).data,
  ),
]).finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
