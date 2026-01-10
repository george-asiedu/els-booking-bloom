import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signUp } = useAuth();
  
  const referralCodeFromUrl = searchParams.get("ref") || "";

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      referralCode: referralCodeFromUrl,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password);

    if (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
      return;
    }

    // Get the new user
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      // Create profile
      await supabase.from("profiles").insert({
        user_id: userData.user.id,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
      });

      // Initialize loyalty points
      await supabase.from("loyalty_points").insert({
        user_id: userData.user.id,
        points: 0,
        lifetime_points: 0,
      });

      // Generate unique referral code
      const referralCode = `${data.fullName.split(" ")[0].toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await supabase.from("referral_codes").insert({
        user_id: userData.user.id,
        code: referralCode,
      });

      // Handle referral if code was provided
      if (data.referralCode) {
        const { data: referrerCode } = await supabase
          .from("referral_codes")
          .select("id, user_id")
          .eq("code", data.referralCode.toUpperCase())
          .single();

        if (referrerCode) {
          // Create referral record
          await supabase.from("referrals").insert({
            referrer_id: referrerCode.user_id,
            referred_id: userData.user.id,
            referral_code_id: referrerCode.id,
          });

          // Update referral code uses
          await supabase
            .from("referral_codes")
            .update({ uses: (await supabase.from("referral_codes").select("uses").eq("id", referrerCode.id).single()).data?.uses || 0 + 1 })
            .eq("id", referrerCode.id);
        }
      }
    }

    setIsLoading(false);
    toast({
      title: "Account created!",
      description: "Welcome to El's Beauty Studio!",
    });
    navigate("/account");
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Join us and earn rewards with every visit
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Code (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter code from a friend"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Signup;
