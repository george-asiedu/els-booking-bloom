import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { galleryApi, categoriesApi } from "@/lib/api";

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
import nails1 from "@/assets/gallery/nails-1.jpg";
import nails2 from "@/assets/gallery/nails-2.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";
import lashes2 from "@/assets/gallery/lashes-2.jpg";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  type: "image" | "video";
}

// Fallback portfolio shown until images are uploaded via the admin gallery.
const fallbackImages: GalleryImage[] = [
  { id: "1", src: nails1, alt: "Elegant French tip acrylics", category: "nails", type: "image" },
  { id: "2", src: nails2, alt: "Trendy ombre gel nails", category: "nails", type: "image" },
  { id: "3", src: lashes1, alt: "Volume lash extensions", category: "lashes", type: "image" },
  { id: "4", src: lashes2, alt: "Classic natural lashes", category: "lashes", type: "image" },
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const { data: apiImages } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: () => galleryApi.listActive(),
  });

  const galleryImages: GalleryImage[] =
    apiImages && apiImages.length > 0
      ? apiImages.map((img) => ({
          id: img.id,
          src: img.image_url,
          alt: img.title || img.category,
          category: img.category,
          type: img.media_type,
        }))
      : fallbackImages;

  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => categoriesApi.listActive(),
  });

  const nameBySlug = new Map((categoriesData ?? []).map((c) => [c.slug, c.name]));
  const catName = (slug: string) => nameBySlug.get(slug) ?? titleize(slug);

  const present = Array.from(new Set(galleryImages.map((i) => i.category)));
  const orderedSlugs = (categoriesData ?? []).map((c) => c.slug);
  const tabSlugs = [
    ...orderedSlugs.filter((s) => present.includes(s)),
    ...present.filter((s) => !orderedSlugs.includes(s)),
  ];

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Gallery
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse my portfolio of nail art and lash extensions. Find inspiration for your next look!
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 mb-12 h-auto">
              <TabsTrigger value="all">All Work</TabsTrigger>
              {tabSlugs.map((slug) => (
                <TabsTrigger key={slug} value={slug}>
                  {catName(slug)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <GalleryGrid images={galleryImages} onImageClick={setSelectedImage} />
            </TabsContent>

            {tabSlugs.map((slug) => (
              <TabsContent key={slug} value={slug}>
                <GalleryGrid
                  images={galleryImages.filter((i) => i.category === slug)}
                  onImageClick={setSelectedImage}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-card">
          {selectedImage &&
            (selectedImage.type === "video" ? (
              <video
                src={selectedImage.src}
                className="w-full h-auto rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="w-full h-auto rounded-lg"
              />
            ))}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (image: GalleryImage) => void;
}

const GalleryGrid = ({ images, onImageClick }: GalleryGridProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {images.map((image, index) => (
      <button
        key={image.id}
        onClick={() => onImageClick(image)}
        className="group relative aspect-square overflow-hidden rounded-lg bg-muted animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {image.type === "video" ? (
          <>
            <video
              src={image.src}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              muted
              playsInline
              preload="metadata"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-foreground">
                <Play className="h-6 w-6 translate-x-0.5" />
              </span>
            </span>
          </>
        ) : (
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-sm text-background font-medium">{image.alt}</p>
        </div>
      </button>
    ))}
  </div>
);

export default Gallery;
