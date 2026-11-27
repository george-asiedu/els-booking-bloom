import { type ProductAudience } from "@/lib/api/products";
import { LoadMore } from "@/components/LoadMore";
import { useCursorPages } from "@/hooks/useCursorPages";
import { useState } from "react";
import { ProductDetails } from "@/components/admin/RowDetails";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStudio } from "@/hooks/useStudio";
import { Plus, Pencil, Trash2, Loader2, ShoppingBag, ImageOff, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { productsApi, productCategoriesApi, ProductDTO } from "@/lib/api";
import { FilterBar } from "@/components/admin/FilterBar";
import {
  Select as FSelect,
  SelectContent as FSelectContent,
  SelectItem as FSelectItem,
  SelectTrigger as FSelectTrigger,
  SelectValue as FSelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatGHS } from "@/lib/currency";

interface ProductFormData {
  name: string;
  category: string;
  description: string;
  price: string;
  costPrice: string;
  promoPrice: string;
  stock: string;
  trackStock: boolean;
  popular: boolean;
  unit: string;
  /** Pre-order: the day it is ready (a date, or empty). */
  availableFrom: string;
  minQuantity: string;
  /** Cheaper per unit in bulk. */
  tiers: { minQty: string; percentOff: string }[];
  /** Each option a customer can choose, with its own price (blank = the main price). */
  options: { label: string; price: string; stock: string }[];
  colors: { name: string; hex: string }[];
  images: string[];
  audience: ProductAudience;
  brand: string;
  attributes: { label: string; value: string }[];
}

const emptyForm: ProductFormData = {
  name: "",
  category: "",
  description: "",
  price: "",
  costPrice: "",
  promoPrice: "",
  stock: "0",
  trackStock: true,
  popular: false,
  unit: "",
  availableFrom: "",
  minQuantity: "1",
  tiers: [],
  options: [],
  colors: [],
  images: [],
  audience: "UNISEX",
  brand: "",
  attributes: [],
};

/**
 * The options a customer chooses from. If any option has its own price, every
 * option is saved with one (a blank one takes the main price); otherwise they
 * are plain choices that all cost the same.
 */
const optionFields = (data: ProductFormData) => {
  const rows = data.options.map((o) => ({ label: o.label.trim(), price: o.price.trim(), stock: o.stock.trim() })).filter((o) => o.label);
  // A stock number on any option means every option counts its own (blank = none left).
  const counted = rows.some((o) => o.stock);
  if (rows.some((o) => o.price) || counted) {
    const main = parseFloat(data.price) || 0;
    return {
      variants: rows.map((o) => ({
        label: o.label,
        price: o.price ? parseFloat(o.price) : main,
        ...(counted ? { stock: Math.max(0, parseInt(o.stock || "0", 10) || 0) } : {}),
      })),
    };
  }
  return { variants: [], sizes: rows.map((o) => o.label) };
};

/** Pre-orders, a minimum order and bulk prices. Up front for a farm, tucked under "more" for other shops. */
const SellingOptions = ({
  form,
  setForm,
  isFarm,
}: {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
  isFarm: boolean;
}) => {
  const used = Boolean(form.availableFrom) || form.minQuantity !== "1" || form.tiers.length > 0;
  const body = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="availableFrom">{isFarm ? "Ready from (pre-order)" : "Ready from (pre-order, optional)"}</Label>
          <Input id="availableFrom" type="date" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
          <p className="text-xs text-muted-foreground">
            A date ahead (a harvest, a restock) opens it for pre-orders: customers order now, it shows "Pre-order", and their delivery can't be earlier. Use the stock above for how many you expect.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minQuantity">Minimum order{form.unit ? ` (${form.unit})` : ""}</Label>
          <Input id="minQuantity" type="number" min={1} step={1} value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
          <p className="text-xs text-muted-foreground">The least a customer can order of it, all options together. 1 means no minimum.</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bulk prices (optional)</Label>
        {form.tiers.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input aria-label={`Bulk price ${i + 1} quantity`} className="w-28" type="number" min={2} placeholder="From qty" value={t.minQty} onChange={(e) => setForm({ ...form, tiers: form.tiers.map((x, j) => (j === i ? { ...x, minQty: e.target.value } : x)) })} />
            <Input aria-label={`Bulk price ${i + 1} discount`} className="w-28" type="number" min={1} max={90} step="0.5" placeholder="% off" value={t.percentOff} onChange={(e) => setForm({ ...form, tiers: form.tiers.map((x, j) => (j === i ? { ...x, percentOff: e.target.value } : x)) })} />
            <span className="text-sm text-muted-foreground">{t.minQty && t.percentOff ? `${t.minQty}+ ${form.unit || "items"}: ${t.percentOff}% off` : ""}</span>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove bulk price" onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, j) => j !== i) })}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {form.tiers.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, tiers: [...form.tiers, { minQty: "", percentOff: "" }] })}>
            <Plus className="mr-2 h-4 w-4" /> Add a bulk price
          </Button>
        )}
        <p className="text-xs text-muted-foreground">Cheaper per unit when a customer buys enough: for example 10+ kg is 5% off and 50+ kg is 10% off. It follows the total bought of this product, and a sale is used instead when it is cheaper.</p>
      </div>
    </div>
  );
  return isFarm ? (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="font-medium">Farm and bulk selling</p>
      {body}
    </div>
  ) : (
    <details className="rounded-xl border p-4" open={used}>
      <summary className="cursor-pointer font-medium">More selling options: pre-orders, minimum order, bulk prices</summary>
      <div className="mt-4">{body}</div>
    </details>
  );
};

const UNIT_SUGGESTIONS = ["kg", "crate", "bag", "dozen", "piece", "litre", "bundle", "tray", "pack"];

const AdminProducts = () => {
  const { config: studioConfig } = useStudio();
  const isFarm = studioConfig?.shopCategory === "farm" || (studioConfig?.shopCategories ?? []).includes("farm");
  // The row whose details drawer is open.
  const [details, setDetails] = useState<ProductDTO | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  // Filters
  const [pSearch, setPSearch] = useState("");
  const [pCategory, setPCategory] = useState("all");
  const [pActive, setPActive] = useState("all");
  const [pStock, setPStock] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const productsQuery = useCursorPages({
    queryKey: ["admin-products", "cursor-pages"],
    queryFn: ({ pageParam }) => productsApi.listAllPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const products = productsQuery.data?.pages.flatMap((page) => page.items);
  const isLoading = productsQuery.isLoading;

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: () => productCategoriesApi.listAll(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["public-products"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id?: string }) => {
      const payload = {
        name: data.name,
        category: data.category,
        description: data.description,
        price: parseFloat(data.price),
        costPrice: data.costPrice.trim() ? parseFloat(data.costPrice) : 0,
        promoPrice: data.promoPrice.trim() ? parseFloat(data.promoPrice) : null,
        stock: parseInt(data.stock || "0", 10),
        trackStock: data.trackStock,
        popular: data.popular,
        image,
        newImages,
        images: data.images,
        unit: data.unit.trim() || null,
        availableFrom: data.availableFrom || null,
        minQuantity: Math.max(1, parseInt(data.minQuantity || "1", 10) || 1),
        bulkTiers: data.tiers
          .filter((t) => t.minQty.trim() && t.percentOff.trim())
          .map((t) => ({ minQty: parseInt(t.minQty, 10), percentOff: parseFloat(t.percentOff) })),
        ...optionFields(data),
        colors: data.colors.filter((c) => c.name.trim()).map((c) => `${c.name.trim()}|${c.hex}`),
        audience: data.audience,
        brand: data.brand.trim() || null,
        attributes: data.attributes
          .filter((a) => a.label.trim() && a.value.trim())
          .map((a) => `${a.label.trim().replace(/\|/g, "/")}|${a.value.trim().replace(/\|/g, "/")}`),
      };
      if (data.id) await productsApi.update(data.id, payload);
      else await productsApi.create(payload);
    },
    onSuccess: () => {
      invalidate();
      setIsDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setImage(null);
    setNewImages([]);
      setNewImages([]);
      toast({ title: editing ? "Product updated" : "Product created" });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      productsApi.update(id, { active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Product deleted" });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, unit: isFarm ? "kg" : "", category: categories[0]?.slug ?? "" });
    setImage(null);
    setNewImages([]);
    setIsDialogOpen(true);
  };

  const openEdit = (p: ProductDTO) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price.toString(),
      costPrice: p.cost_price ? p.cost_price.toString() : "",
      promoPrice: p.promo_price != null ? p.promo_price.toString() : "",
      stock: p.stock.toString(),
      trackStock: p.track_stock,
      popular: p.popular,
      unit: p.unit ?? "",
      availableFrom: p.available_from ?? "",
      minQuantity: String(p.min_quantity),
      tiers: p.bulk_tiers.map((t) => ({ minQty: String(t.minQty), percentOff: String(t.percentOff) })),
      options: p.variants.length
        ? p.variants.map((v) => ({ label: v.label, price: String(v.price), stock: v.stock !== undefined ? String(v.stock) : "" }))
        : p.sizes.map((label) => ({ label, price: "", stock: "" })),
      colors: p.colors,
      audience: p.audience,
      brand: p.brand ?? "",
      attributes: p.attributes,
      // The first photo is the main image, edited by its own field.
      images: p.images.slice(p.image_url ? 1 : 0),
    });
    setImage(null);
    setNewImages([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      toast({
        variant: "destructive",
        title: "Category required",
        description: "Create a product category first.",
      });
      return;
    }
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  const filtersActive =
    pSearch.trim() !== "" || pCategory !== "all" || pActive !== "all" || pStock !== "all";
  const filtered = (products ?? []).filter((p) => {
    if (pSearch.trim() && !p.name.toLowerCase().includes(pSearch.trim().toLowerCase()))
      return false;
    if (pCategory !== "all" && p.category !== pCategory) return false;
    if (pActive === "active" && !p.active) return false;
    if (pActive === "inactive" && p.active) return false;
    if (pStock === "in" && !p.in_stock) return false;
    if (pStock === "out" && p.in_stock) return false;
    return true;
  });
  const clearFilters = () => {
    setPSearch("");
    setPCategory("all");
    setPActive("all");
    setPStock("all");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your shop products</p>
          </div>
          <Button onClick={openCreate} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add product
          </Button>
        </div>

        {products && products.length > 0 && (
          <FilterBar
            search={pSearch}
            onSearch={setPSearch}
            searchPlaceholder="Search products…"
            onClear={clearFilters}
            active={filtersActive}
            count={filtered.length}
          >
            <FSelect value={pCategory} onValueChange={setPCategory}>
              <FSelectTrigger className="w-[150px]"><FSelectValue placeholder="Category" /></FSelectTrigger>
              <FSelectContent>
                <FSelectItem value="all">All categories</FSelectItem>
                {categories.map((c) => (
                  <FSelectItem key={c.id} value={c.slug}>{c.name}</FSelectItem>
                ))}
              </FSelectContent>
            </FSelect>
            <FSelect value={pActive} onValueChange={setPActive}>
              <FSelectTrigger className="w-[130px]"><FSelectValue /></FSelectTrigger>
              <FSelectContent>
                <FSelectItem value="all">Any status</FSelectItem>
                <FSelectItem value="active">Active</FSelectItem>
                <FSelectItem value="inactive">Inactive</FSelectItem>
              </FSelectContent>
            </FSelect>
            <FSelect value={pStock} onValueChange={setPStock}>
              <FSelectTrigger className="w-[130px]"><FSelectValue /></FSelectTrigger>
              <FSelectContent>
                <FSelectItem value="all">Any stock</FSelectItem>
                <FSelectItem value="in">In stock</FSelectItem>
                <FSelectItem value="out">Out of stock</FSelectItem>
              </FSelectContent>
            </FSelect>
          </FilterBar>
        )}

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Create a{" "}
              <Link to="/admin/product-categories" className="text-primary underline">
                product category
              </Link>{" "}
              before adding products.
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => (
                  <TableRow key={p.id} onOpen={() => setDetails(p)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.popular && <Badge variant="default">Popular</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.on_promo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through text-sm">
                            {formatGHS(p.price)}
                          </span>
                          <span className="font-medium">{formatGHS(p.promo_price)}</span>
                        </div>
                      ) : (
                        <>{formatGHS(p.price)}</>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.track_stock ? (
                        <span className={p.stock <= 0 ? "text-destructive" : ""}>
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∞</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: p.id, active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <LoadMore query={productsQuery} />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                      {!c.active ? " (hidden)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (GHS)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost price (GHS)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Your cost"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoPrice">Promo price (GHS, optional)</Label>
              <Input
                id="promoPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty for no promo"
                value={form.promoPrice}
                onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Profit (your commerce revenue) = selling price − cost price.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.options.some((o) => o.stock.trim()) ? String(form.options.reduce((n, o) => n + (parseInt(o.stock || "0", 10) || 0), 0)) : form.stock}
                  disabled={!form.trackStock || form.options.some((o) => o.stock.trim())}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
                {form.options.some((o) => o.stock.trim()) && <p className="text-xs text-muted-foreground">Added up from the options below.</p>}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="trackStock"
                  checked={form.trackStock}
                  onCheckedChange={(c) => setForm({ ...form, trackStock: c })}
                />
                <Label htmlFor="trackStock">Track stock</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="more-images">More photos (up to 8)</Label>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.images.map((src) => (
                    <button
                      key={src}
                      type="button"
                      aria-label="Remove this photo"
                      title="Remove this photo"
                      onClick={() => setForm({ ...form, images: form.images.filter((x) => x !== src) })}
                      className="group relative h-16 w-16 overflow-hidden rounded border"
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex"><Trash2 className="h-4 w-4" /></span>
                    </button>
                  ))}
                </div>
              )}
              <Input id="more-images" type="file" accept="image/*" multiple onChange={(e) => setNewImages([...(e.target.files ?? [])])} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audience">Who it's for</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as ProductAudience })}>
                  <SelectTrigger id="audience"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNISEX">Everyone</SelectItem>
                    <SelectItem value="WOMEN">Women</SelectItem>
                    <SelectItem value="MEN">Men</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Puts it under Men or Women in your shop. Everyone shows in both.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand (optional)</Label>
                <Input id="brand" value={form.brand} maxLength={60} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Levi's" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Product details (optional)</Label>
              <p className="text-xs text-muted-foreground">Shown as a table on the product page, e.g. Fabric: Cotton, Fit: Regular.</p>
              {form.attributes.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label="Detail"
                    value={a.label}
                    maxLength={30}
                    placeholder="Fabric"
                    className="w-36"
                    onChange={(e) => setForm({ ...form, attributes: form.attributes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  />
                  <Input
                    aria-label="Value"
                    value={a.value}
                    maxLength={60}
                    placeholder="Bio-washed cotton"
                    onChange={(e) => setForm({ ...form, attributes: form.attributes.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })}
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove detail" onClick={() => setForm({ ...form, attributes: form.attributes.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.attributes.length < 12 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, attributes: [...form.attributes, { label: "", value: "" }] })}>
                  <Plus className="mr-2 h-4 w-4" /> Add detail
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Sold by (optional)</Label>
              <Input id="unit" list="unit-suggestions" maxLength={20} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, crate, bag, dozen..." />
              <datalist id="unit-suggestions">
                {UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Shows after the price: GHS 45 per kg. Customers order a whole number of them.</p>
            </div>
            <div className="space-y-2">
              <Label>Options and prices (optional)</Label>
              {form.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label={`Option ${i + 1} name`}
                    value={o.label}
                    maxLength={40}
                    placeholder="e.g. 5 kg bag, or Large"
                    onChange={(e) => setForm({ ...form, options: form.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  />
                  <Input
                    aria-label={`Option ${i + 1} stock`}
                    className="w-24"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="In stock"
                    value={o.stock}
                    onChange={(e) => setForm({ ...form, options: form.options.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)) })}
                  />
                  <Input
                    aria-label={`Option ${i + 1} price`}
                    className="w-32"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={o.price}
                    onChange={(e) => setForm({ ...form, options: form.options.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })}
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove option" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.options.length < 30 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, options: [...form.options, { label: "", price: "", stock: "" }] })}>
                  <Plus className="mr-2 h-4 w-4" /> Add option
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Customers must pick one. Give an option a price and each one can cost something different (1 kg, 5 kg, a 20 kg crate). Leave every price empty and they all cost the main price. Give each option a number in stock and each counts its own (the stock above is then their total). Leave them empty and all options share the stock above. A sale takes the same percentage off each.
              </p>
            </div>
            <SellingOptions form={form} setForm={setForm} isFarm={isFarm} />
            <div className="space-y-2">
              <Label>Colours (optional)</Label>
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Colour"
                    value={c.hex}
                    onChange={(e) => setForm({ ...form, colors: form.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                    className="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    aria-label="Colour name"
                    value={c.name}
                    placeholder="Colour name, e.g. Sand"
                    onChange={(e) => setForm({ ...form, colors: form.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove colour" onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, colors: [...form.colors, { name: "", hex: "#000000" }] })}>
                <Plus className="mr-2 h-4 w-4" /> Add colour
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">
                Image {editing && "(leave empty to keep current)"}
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="popular"
                checked={form.popular}
                onCheckedChange={(c) => setForm({ ...form, popular: c })}
              />
              <Label htmlFor="popular">Mark as popular</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ProductDetails item={details} onClose={() => setDetails(null)} />
    </AdminLayout>
  );
};

export default AdminProducts;
