import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, ImageIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { Lightbox, LightboxImage } from "@/components/storefront/Lightbox";
import { galleryApi, categoriesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import nails1 from "@/assets/gallery/nails-1.jpg";
import nails2 from "@/assets/gallery/nails-2.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";
import lashes2 from "@/assets/gallery/lashes-2.jpg";

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category: string;
  type: "image" | "video";
}

const fallback: GalleryItem[] = [
  { id: "1", src: nails1, alt: "French tip acrylics", category: "nails", type: "image" },
  { id: "2", src: nails2, alt: "Ombre gel nails", category: "nails", type: "image" },
  { id: "3", src: lashes1, alt: "Volume lash extensions", category: "lashes", type: "image" },
  { id: "4", src: lashes2, alt: "Classic natural lashes", category: "lashes", type: "image" },
];

const Gallery = () => {
  const [activeCat, setActiveCat] = useState("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const { data: apiImages, isLoading } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: () => galleryApi.listActive(),
  });
  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => categoriesApi.listActive(),
  });

  const hasReal = !!apiImages && apiImages.length > 0;
  const items: GalleryItem[] = hasReal
    ? apiImages!.map((img) => ({
        id: img.id,
        src: img.image_url,
        alt: img.title || titleize(img.category),
        category: img.category,
        type: img.media_type,
      }))
    : fallback;

  const nameBySlug = new Map((categoriesData ?? []).map((c) => [c.slug, c.name]));
  const catName = (slug: string) => nameBySlug.get(slug) ?? titleize(slug);

  const present = Array.from(new Set(items.map((i) => i.category)));
  const orderedSlugs = (categoriesData ?? []).map((c) => c.slug);
  const tabSlugs = [
    ...orderedSlugs.filter((s) => present.includes(s)),
    ...present.filter((s) => !orderedSlugs.includes(s)),
  ];

  const filtered = useMemo(
    () => (activeCat === "all" ? items : items.filter((i) => i.category === activeCat)),
    [items, activeCat],
  );
  const lightboxItems: LightboxImage[] = filtered.map((i) => ({
    src: i.src,
    alt: i.alt,
    type: i.type,
  }));

  const heroImg = items[0]?.src ?? null;
  const noContent = !isLoading && hasReal === false && apiImages !== undefined && apiImages.length === 0;

  return (
    <Layout>
      <StudioPageHero
        eyebrow="Our work"
        title={
          <>
            A little inspiration
            <br />
            <span className="text-primary">for your next look.</span>
          </>
        }
        description="Explore some of our latest work, styles and transformations."
        image={heroImg}
        variant="editorial"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="mb-4 w-full animate-pulse rounded-xl bg-muted"
                  style={{ height: 160 + (i % 3) * 60 }}
                />
              ))}
            </div>
          ) : noContent ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <ImageIcon className="mx-auto mb-4 h-10 w-10 text-primary/40" />
              <h2 className="font-serif text-2xl font-bold">
                Our gallery is getting ready.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Beautiful work will appear here soon.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/services">Explore services</Link>
              </Button>
            </div>
          ) : (
            <>
              {tabSlugs.length > 1 && (
                <div className="mb-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {["all", ...tabSlugs].map((slug) => (
                    <button
                      key={slug}
                      onClick={() => setActiveCat(slug)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium uppercase tracking-wide transition-colors",
                        activeCat === slug
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {slug === "all" ? "All" : catName(slug)}
                    </button>
                  ))}
                </div>
              )}

              <div className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4">
                {filtered.map((item, i) => (
                  <Reveal key={item.id} delay={(i % 4) * 60} className="mb-3 md:mb-4">
                    <button
                      onClick={() => setLightbox(i)}
                      className="group relative block w-full overflow-hidden rounded-xl bg-muted"
                      aria-label={`View ${item.alt}`}
                    >
                      {item.type === "video" ? (
                        <>
                          <video
                            src={item.src}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/85 text-foreground">
                              <Play className="h-5 w-5 translate-x-0.5" />
                            </span>
                          </span>
                        </>
                      ) : (
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="lazy"
                          decoding="async"
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <span className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/70 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="text-sm font-medium text-background">
                          View →
                        </span>
                      </span>
                    </button>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Lightbox images={lightboxItems} index={lightbox} onIndexChange={setLightbox} />
    </Layout>
  );
};

export default Gallery;
