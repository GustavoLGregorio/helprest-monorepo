import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";

export interface LocationQueryResult {
    lat: string;
    lon: string;
    display_name: string;
    [key: string]: unknown;
}

export default function useLocationQuery(address: string) {
    const { data, isLoading, isSuccess, isError } = useQuery<LocationQueryResult[]>({
        queryKey: queryKeys.location.byAddress(address),
        queryFn: async () => {
            if (!address) return [];
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                    address
                )}&format=json`
            );

            return response.json();
        },
        enabled: Boolean(address && address.trim().length > 0),
    });

    return { data, isLoading, isSuccess, isError };
}
