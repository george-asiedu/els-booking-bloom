import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { wishlistApi } from "@/lib/api";

/** The signed-in customer's saved products. Guests are sent to log in. */
export const useWishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isCustomer = !!user && user.role !== "ADMIN";
  const { data: ids = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.list(),
    enabled: isCustomer,
  });
  const mutation = useMutation({
    mutationFn: (id: string) => (ids.includes(id) ? wishlistApi.remove(id) : wishlistApi.add(id)),
    onSuccess: (next, id) => {
      queryClient.setQueryData(["wishlist"], next);
      toast(
        next.includes(id)
          ? { title: "Added to your wishlist", description: "Find it any time under the heart at the top." }
          : { variant: "info", title: "Removed from your wishlist" },
      );
    },
    onError: (e) =>
      toast({ variant: "destructive", title: "Couldn't update your wishlist", description: e instanceof Error ? e.message : "Please try again." }),
  });
  const toggle = (id: string) => {
    if (!user) navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
    else if (isCustomer) mutation.mutate(id);
  };
  return { ids, toggle, has: (id: string) => ids.includes(id) };
};
