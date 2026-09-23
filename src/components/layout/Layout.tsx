import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBookingBar } from "./MobileBookingBar";
import { StudioPreviewExit } from "@/components/StudioPreviewExit";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  // When true, the hero sits UNDER a transparent header (home page). Other pages
  // keep the solid header + top padding so content never hides behind it.
  heroOverlay?: boolean;
}

export const Layout = ({ children, heroOverlay = false }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar overlay={heroOverlay} />
      <main className={cn("flex-1", !heroOverlay && "pt-20")}>{children}</main>
      <Footer />
      <MobileBookingBar />
      <StudioPreviewExit />
    </div>
  );
};
