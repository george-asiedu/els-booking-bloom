export const videoEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
      }
      if (parsed.pathname.startsWith("/shorts/")) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.pathname.split("/")[2] ?? "")}`;
      if (parsed.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.pathname.split("/")[2] ?? "")}`;
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const match = parsed.pathname.match(/\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  } catch { /* invalid/unsupported provider URL */ }
  return null;
};
