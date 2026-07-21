export interface Service {
  id: string;
  name: string;
  category: "nails" | "lashes" | "hair";
  description: string;
  duration: string;
  price: number;
  popular?: boolean;
}

export const services: Service[] = [
  // Nail Services
  {
    id: "acrylic-full",
    name: "Full Set Acrylics",
    category: "nails",
    description: "Full set of sculpted acrylic nails with your choice of shape and length",
    duration: "2 hrs",
    price: 65,
    popular: true,
  },
  {
    id: "acrylic-fill",
    name: "Acrylic Fill",
    category: "nails",
    description: "Maintenance fill for existing acrylic nails",
    duration: "1.5 hrs",
    price: 45,
  },
  {
    id: "gel-manicure",
    name: "Gel Manicure",
    category: "nails",
    description: "Long-lasting gel polish with nail shaping and cuticle care",
    duration: "1 hr",
    price: 40,
    popular: true,
  },
  {
    id: "classic-manicure",
    name: "Classic Manicure",
    category: "nails",
    description: "Traditional manicure with nail shaping, cuticle care, and polish",
    duration: "45 min",
    price: 25,
  },
  {
    id: "spa-pedicure",
    name: "Spa Pedicure",
    category: "nails",
    description: "Relaxing pedicure with exfoliation, massage, and polish",
    duration: "1 hr",
    price: 50,
  },
  {
    id: "nail-art",
    name: "Nail Art Add-on",
    category: "nails",
    description: "Custom nail art designs (per nail)",
    duration: "15 min",
    price: 5,
  },
  // Lash Services
  {
    id: "classic-lashes",
    name: "Classic Lash Set",
    category: "lashes",
    description: "Natural-looking lash extensions, one extension per natural lash",
    duration: "2 hrs",
    price: 120,
    popular: true,
  },
  {
    id: "hybrid-lashes",
    name: "Hybrid Lash Set",
    category: "lashes",
    description: "Mix of classic and volume lashes for a textured look",
    duration: "2.5 hrs",
    price: 150,
  },
  {
    id: "volume-lashes",
    name: "Volume Lash Set",
    category: "lashes",
    description: "Multiple lightweight extensions per lash for dramatic fullness",
    duration: "3 hrs",
    price: 180,
    popular: true,
  },
  {
    id: "lash-fill",
    name: "Lash Fill",
    category: "lashes",
    description: "Maintenance fill for existing lash extensions (2-3 weeks)",
    duration: "1 hr",
    price: 60,
  },
  {
    id: "lash-removal",
    name: "Lash Removal",
    category: "lashes",
    description: "Safe removal of existing lash extensions",
    duration: "30 min",
    price: 25,
  },
  // Hair Services
  {
    id: "silk-press",
    name: "Silk Press",
    category: "hair",
    description: "Wash, blow-dry and silk press for a smooth, sleek finish",
    duration: "1.5 hrs",
    price: 70,
    popular: true,
  },
  {
    id: "knotless-braids",
    name: "Knotless Braids",
    category: "hair",
    description: "Protective knotless box braids in your choice of length",
    duration: "4 hrs",
    price: 160,
    popular: true,
  },
  {
    id: "wig-install",
    name: "Wig Install",
    category: "hair",
    description: "Custom lace wig install with styling and laid edges",
    duration: "2 hrs",
    price: 120,
  },
  {
    id: "wash-and-style",
    name: "Wash & Style",
    category: "hair",
    description: "Cleansing shampoo, condition and blow-out with styling",
    duration: "1 hr",
    price: 55,
  },
];

export const getServicesByCategory = (category: "nails" | "lashes" | "hair") =>
  services.filter((s) => s.category === category);

export const getServiceById = (id: string) =>
  services.find((s) => s.id === id);
