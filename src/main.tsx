import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { maybeResolveCustomDomain } from "@/lib/apiClient";

// If served from a studio's custom domain, resolve it to a studio before the app
// renders so everything is scoped correctly. No-op elsewhere.
maybeResolveCustomDomain().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
