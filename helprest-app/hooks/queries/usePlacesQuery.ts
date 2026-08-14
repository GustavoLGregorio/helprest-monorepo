import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/constants/queryKeys";

export default function usePlacesQuery() {
    const { data, isLoading, isSuccess, isError } = useQuery({
        queryKey: queryKeys.establishments.all,
        queryFn: async () => {
            const response = await api.get("/api/establishments?page=1&limit=50", {
                authenticated: true,
            });

            if (!response.ok) throw new Error("Falha ao carregar estabelecimentos");
            return response.data;
        },
    });

    return { data, isLoading, isSuccess, isError };
}
