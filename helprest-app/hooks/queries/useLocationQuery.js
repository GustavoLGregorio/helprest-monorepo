import { useQuery } from "@tanstack/react-query";

export default function useLocationQuery(address) {
    const { data, isLoading, isSuccess, isError } = useQuery({
        queryKey: [address],
        queryFn: async () => {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                    address
                )}&format=json`
            );

            return response.json();
        },
    });

    return { data, isLoading, isSuccess, isError };
}
