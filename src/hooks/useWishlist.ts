import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { wishlistApi } from "@/lib/api";

/** The signed-in customer's saved products. Guests are sent to log in. */
export const useWishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const isCustomer = !!user && user.role !== "ADMIN";
  const { data: ids = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.list(),
    enabled: isCustomer,
  });
  const mutation = useMutation({
    mutationFn: (id: string) => (ids.includes(id) ? wishlistApi.remove(id) : wishlistApi.add(id)),
    onSuccess: (next) => queryClient.setQueryData(["wishlist"], next),
  });
  const toggle = (id: string) => {
    if (!user) navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
    else if (isCustomer) mutation.mutate(id);
  };
  return { ids, toggle, has: (id: string) => ids.includes(id) };
};
