import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformLayout } from "./PlatformLayout";
import { platformApi, StudioFeatureSettings } from "@/lib/platformApi";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(40, "Slug is too long")
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Lowercase letters, numbers and hyphens only",
    ),
  ownerEmail: z.string().email("Enter a valid email"),
  ownerPassword: z.string().min(8, "At least 8 characters"),
  ownerFullName: z.string().trim().max(80).optional(),
});

type FormValues = z.infer<typeof schema>;

const FEATURES: { key: keyof StudioFeatureSettings; label: string; hint: string }[] =
  [
    { key: "reviews", label: "Reviews", hint: "Customer ratings & testimonials" },
    { key: "gallery", label: "Gallery", hint: "Showcase of past work" },
    { key: "loyalty", label: "Loyalty points", hint: "Earn & redeem points" },
    { key: "referrals", label: "Referrals", hint: "Referral codes & rewards" },
    { key: "commerce", label: "Shop", hint: "Sell products online" },
    {
      key: "onlinePayments",
      label: "Online payments",
      hint: "Paystack checkout for bookings",
    },
    {
      key: "productsInBooking",
      label: "Products in booking",
      hint: "Add products during checkout",
    },
  ];

const DEFAULT_FEATURES: StudioFeatureSettings = {
  reviews: true,
  gallery: true,
  loyalty: true,
  referrals: true,
  commerce: false,
  onlinePayments: false,
  productsInBooking: false,
};

// Slug suggestion from a studio name.
const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const PlatformStudioNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [features, setFeatures] = useState<StudioFeatureSettings>(DEFAULT_FEATURES);
  const [slugEdited, setSlugEdited] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      ownerEmail: "",
      ownerPassword: "",
      ownerFullName: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const studio = await platformApi.createStudio({
        name: data.name,
        slug: data.slug,
        ownerEmail: data.ownerEmail,
        ownerPassword: data.ownerPassword,
        ownerFullName: data.ownerFullName || undefined,
        settings: features,
      });
      toast({
        title: "Studio created",
        description: `${studio.name} is ready.`,
      });
      navigate(`/platform/studios/${studio.id}`, { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create studio",
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <PlatformLayout>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/platform">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to studios
        </Link>
      </Button>

      <h1 className="mb-6 font-serif text-2xl font-semibold">New studio</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Studio details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Studio name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bella Beauty Studio"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!slugEdited) {
                              form.setValue("slug", slugify(e.target.value), {
                                shouldValidate: true,
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (subdomain)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="bella-beauty"
                          {...field}
                          onChange={(e) => {
                            setSlugEdited(true);
                            field.onChange(e.target.value.toLowerCase());
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for the studio's URL, e.g.{" "}
                        <span className="font-mono">
                          {(field.value || "your-studio")}.yourplatform.com
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owner account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="ownerFullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner name (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="owner@studio.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These are the credentials the studio admin signs in with.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {FEATURES.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <Label htmlFor={f.key} className="cursor-pointer">
                        {f.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{f.hint}</p>
                    </div>
                    <Switch
                      id={f.key}
                      checked={features[f.key]}
                      onCheckedChange={(v) =>
                        setFeatures((prev) => ({ ...prev, [f.key]: v }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create studio
            </Button>
          </div>
        </form>
      </Form>
    </PlatformLayout>
  );
};

export default PlatformStudioNew;
