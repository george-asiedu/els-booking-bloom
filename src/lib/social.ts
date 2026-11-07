// Turn a stored handle (or full URL) into a working social profile link.
export const socialHref = (kind: "instagram" | "tiktok" | "facebook", v: string) => {
  if (v.startsWith("http")) return v;
  const handle = v.replace(/^@/, "").trim();
  if (kind === "instagram") return `https://instagram.com/${handle}`;
  if (kind === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return `https://facebook.com/${handle}`;
};
