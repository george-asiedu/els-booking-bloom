import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIOS } from "./content";
import { StorefrontMockup } from "./Visuals";

export const StorefrontsSection = () => {
  const [activeStudio, setActiveStudio] = useState(0);

  return (
    <>
      {/* ------------------------------------------ Multi-tenant storefronts */}
      <section id="for-studios" className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div>
                <h2 className="font-serif text-3xl font-semibold leading-[1.1] md:text-5xl">
                  Your own website, in your own colours.
                </h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Every studio gets its own web address, with its logo, prices and
                  photos. Pick one below to see how different they look.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                {STUDIOS.map((s, i) => (
                  <div key={s.key}>
                    <button
                      onClick={() => setActiveStudio(i)}
                      onMouseEnter={() => setActiveStudio(i)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow] duration-300",
                        activeStudio === i
                          ? "border-primary bg-card shadow-md"
                          : "border-border bg-card/50 hover:bg-card",
                      )}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif font-semibold text-white"
                        style={{ backgroundColor: `hsl(${s.accent})` }}
                      >
                        {s.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {s.name}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {s.slug}.zuristudios.com
                        </span>
                      </span>
                      <ArrowRight
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0 transition-[opacity,color]",
                          activeStudio === i
                            ? "text-primary opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <StorefrontMockup
                key={STUDIOS[activeStudio].key}
                studio={STUDIOS[activeStudio]}
                className="animate-fade-in"
              />
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

