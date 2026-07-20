import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface FavoriteItem {
    id: string; // O backend na verdade retorna os DTOs inteiros na listagem inteira!
    // Usaremos partial do objeto para cache mas com ID
    [key: string]: any;
}

export interface FavoritesResponse {
    establishments: FavoriteItem[];
    products: FavoriteItem[];
}

export const useFavorites = () => {
    const queryClient = useQueryClient();

    const { data: favorites, isLoading } = useQuery<FavoritesResponse>({
        queryKey: ["favorites"],
        queryFn: async () => {
            const res = await api.get<FavoritesResponse>("/api/favorites", { authenticated: true });
            if (!res.ok) return { establishments: [], products: [] };
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 mins caches for active session
    });

    const addFavorite = useMutation({
        mutationFn: async ({ referenceId, type }: { referenceId: string; type: "establishment" | "product" }) => {
            const res = await api.post("/api/favorites", { body: { referenceId, type }, authenticated: true });
            if (!res.ok) throw new Error("Failed to add favorite");
        },
        onMutate: async ({ referenceId, type }) => {
            await queryClient.cancelQueries({ queryKey: ["favorites"] });
            const previous = queryClient.getQueryData<FavoritesResponse>(["favorites"]);
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["favorites"], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        }
    });

    const removeFavorite = useMutation({
        mutationFn: async (referenceId: string) => {
            const res = await api.delete(`/api/favorites/${referenceId}`, { authenticated: true });
            if (!res.ok) throw new Error("Failed to remove favorite");
        },
        onMutate: async (referenceId) => {
            await queryClient.cancelQueries({ queryKey: ["favorites"] });
            const previous = queryClient.getQueryData<FavoritesResponse>(["favorites"]);
            
            if (previous) {
                queryClient.setQueryData<FavoritesResponse>(["favorites"], {
                    establishments: previous.establishments.filter(e => e.id !== referenceId),
                    products: previous.products.filter(p => p.id !== referenceId)
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["favorites"], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        }
    });

    const isFavorite = (id: string, type: "establishment" | "product") => {
        if (!favorites) return false;
        if (type === "establishment") return favorites.establishments.some(e => e.id === id);
        if (type === "product") return favorites.products.some(p => p.id === id);
        return false;
    };

    return {
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite: (id: string, type: "establishment" | "product") => {
            if (isFavorite(id, type)) {
                removeFavorite.mutate(id);
            } else {
                addFavorite.mutate({ referenceId: id, type });
            }
        }
    };
};
