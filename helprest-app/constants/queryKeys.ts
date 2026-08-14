/**
 * Strongly-typed Query Key Factory for TanStack Query
 * Centralizes all cache keys across the mobile application to prevent key collisions,
 * eliminate magic strings, and provide safe query invalidations.
 */

export const queryKeys = {
    user: {
        all: ["user"] as const,
        me: () => [...queryKeys.user.all, "me"] as const,
        profile: (id: string) => [...queryKeys.user.all, "profile", id] as const,
    },
    establishments: {
        all: ["establishments"] as const,
        list: (filters?: { page?: number; limit?: number }) =>
            filters ? ([...queryKeys.establishments.all, "list", filters] as const) : ([...queryKeys.establishments.all, "list"] as const),
        recommended: (coords?: { lat: number; lng: number } | null) =>
            coords
                ? ([...queryKeys.establishments.all, "recommended", coords.lat, coords.lng] as const)
                : ([...queryKeys.establishments.all, "recommended"] as const),
        nearby: (coords: { lat: number; lng: number }, maxDistance?: number) =>
            [...queryKeys.establishments.all, "nearby", coords.lat, coords.lng, maxDistance] as const,
        search: (query: string) =>
            [...queryKeys.establishments.all, "search", query] as const,
        detail: (id: string | null | undefined) =>
            [...queryKeys.establishments.all, "detail", id ?? ""] as const,
        myEstablishment: () =>
            [...queryKeys.establishments.all, "my-establishment"] as const,
    },
    products: {
        all: ["products"] as const,
        byEstablishment: (establishmentId: string) =>
            [...queryKeys.products.all, "establishment", establishmentId] as const,
        detail: (id: string) =>
            [...queryKeys.products.all, "detail", id] as const,
    },
    flags: {
        all: ["flags"] as const,
        list: () => [...queryKeys.flags.all, "list"] as const,
    },
    visits: {
        all: ["visits"] as const,
        byUser: (userId: string) => [...queryKeys.visits.all, "user", userId] as const,
        byEstablishment: (establishmentId: string) => [...queryKeys.visits.all, "establishment", establishmentId] as const,
        socialFeed: (coords?: { lat: number; lng: number }) =>
            coords
                ? ([...queryKeys.visits.all, "socialFeed", coords.lat, coords.lng] as const)
                : ([...queryKeys.visits.all, "socialFeed"] as const),
    },
    favorites: {
        all: ["favorites"] as const,
        list: () => [...queryKeys.favorites.all, "list"] as const,
    },
    location: {
        all: ["location"] as const,
        byAddress: (address: string) => [...queryKeys.location.all, address] as const,
    },
} as const;
