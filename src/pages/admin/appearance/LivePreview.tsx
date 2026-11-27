import { useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudioContentDTO } from "@/lib/api";
import { cn } from "@/lib/utils";

const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;

/**
 * The owner's own website in a frame, showing what they are changing as they
 * type, before anything is saved. It is the real site, so the wording, photos,
 * design and carousel look exactly as customers will see them. Nothing here
 * can change the site: the frame only receives a copy of the draft.
 */
export const LivePreview = ({ value, className }: { value: StudioContentDTO; className?: string }) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"desktop" | "phone">("desktop");
  const [boxWidth, setBoxWidth] = useState(600);
  const latest = useRef(value);
  latest.current = value;

  const send = () => frame.current?.contentWindow?.postMessage({ source: "zuri-preview", content: latest.current }, window.location.origin);

  // The site asks for the draft when it opens, and on every change after that.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if ((e.data as { source?: string } | null)?.source === "zuri-preview-ready") send();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  useEffect(() => {
    const t = window.setTimeout(send, 200);
    return () => window.clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    setBoxWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const width = mode === "desktop" ? DESKTOP_WIDTH : PHONE_WIDTH;
  const scale = Math.min(1, boxWidth / width);
  // The site is drawn at a real screen width and shrunk to fit; its height is chosen so the frame looks 640px tall.
  const visualHeight = 640;
  const innerHeight = visualHeight / scale;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Live preview</p>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant={mode === "desktop" ? "secondary" : "ghost"} aria-pressed={mode === "desktop"} onClick={() => setMode("desktop")}>
            <Monitor className="mr-1.5 h-4 w-4" /> Computer
          </Button>
          <Button type="button" size="sm" variant={mode === "phone" ? "secondary" : "ghost"} aria-pressed={mode === "phone"} onClick={() => setMode("phone")}>
            <Smartphone className="mr-1.5 h-4 w-4" /> Phone
          </Button>
        </div>
      </div>
      <div ref={box} className="overflow-hidden rounded-xl border bg-muted/40">
        <div className="mx-auto overflow-hidden" style={{ width: width * scale, height: visualHeight }}>
          <iframe
            ref={frame}
            title="Preview of your website"
            src="/?zuri-preview=1"
            onLoad={send}
            style={{ width, height: innerHeight, transform: `scale(${scale})`, transformOrigin: "top left", border: 0 }}
            className="bg-background"
          />
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        What you change shows here straight away. Customers see it only after you press Save.{" "}
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
          Open your site <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
};
