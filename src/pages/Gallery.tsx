import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import nails1 from "@/assets/gallery/nails-1.jpg";
import nails2 from "@/assets/gallery/nails-2.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";
import lashes2 from "@/assets/gallery/lashes-2.jpg";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: "nails" | "lashes";
}

const galleryImages: GalleryImage[] = [
  { id: "1", src: nails1, alt: "Elegant French tip acrylics", category: "nails" },
  { id: "2", src: nails2, alt: "Trendy ombre gel nails", category: "nails" },
  { id: "3", src: lashes1, alt: "Volume lash extensions", category: "lashes" },
  { id: "4", src: lashes2, alt: "Classic natural lashes", category: "lashes" },
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const nailImages = galleryImages.filter((img) => img.category === "nails");
  const lashImages = galleryImages.filter((img) => img.category === "lashes");

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
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12">
              <TabsTrigger value="all">All Work</TabsTrigger>
              <TabsTrigger value="nails">Nails</TabsTrigger>
              <TabsTrigger value="lashes">Lashes</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <GalleryGrid images={galleryImages} onImageClick={setSelectedImage} />
            </TabsContent>

            <TabsContent value="nails">
              <GalleryGrid images={nailImages} onImageClick={setSelectedImage} />
            </TabsContent>

            <TabsContent value="lashes">
              <GalleryGrid images={lashImages} onImageClick={setSelectedImage} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-card">
          {selectedImage && (
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-auto rounded-lg"
            />
          )}
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
        <img
          src={image.src}
          alt={image.alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-sm text-background font-medium">{image.alt}</p>
        </div>
      </button>
    ))}
  </div>
);

export default Gallery;
