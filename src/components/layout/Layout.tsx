import { ReactNode, useRef } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBookingBar } from "./MobileBookingBar";
import { FloatingActions } from "./FloatingActions";
import { StudioPreviewExit } from "@/components/StudioPreviewExit";

interface LayoutProps {
  children: ReactNode;
  // When true, the hero sits UNDER a transparent header (home page). Other pages
  // keep the solid header + top padding so content never hides behind it.
  heroOverlay?: boolean;
}

export const Layout = ({ children, heroOverlay = false }: LayoutProps) => {
  const mainRef = useRef<HTMLElement>(null);
  useRevealOnScroll(mainRef);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar overlay={heroOverlay} />
      {/* The fixed header (with its info strip) sets --site-header-h. */}
      <main ref={mainRef} className="flex-1" style={heroOverlay ? undefined : { paddingTop: "var(--site-header-h, 5rem)" }}>
        {children}
      </main>
      <Footer />
      <MobileBookingBar />
      <FloatingActions />
      <StudioPreviewExit />
    </div>
  );
};
