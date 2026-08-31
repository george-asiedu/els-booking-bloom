import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, ShoppingBag, ImageOff } from "lucide-react";
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
};

const AdminProducts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  // Filters
  const [pSearch, setPSearch] = useState("");
  const [pCategory, setPCategory] = useState("all");
  const [pActive, setPActive] = useState("all");
  const [pStock, setPStock] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => productsApi.listAll(),
  });

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
    setForm({ ...emptyForm, category: categories[0]?.slug ?? "" });
    setImage(null);
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
    });
    setImage(null);
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
            Add Product
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
                  <TableRow key={p.id}>
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
                            GHS {p.price}
                          </span>
                          <span className="font-medium">GHS {p.promo_price}</span>
                        </div>
                      ) : (
                        <>GHS {p.price}</>
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
                  value={form.stock}
                  disabled={!form.trackStock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
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
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
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
    </AdminLayout>
  );
};

export default AdminProducts;
