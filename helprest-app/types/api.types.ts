// ── API Types ──
// Mirrors backend DTOs for type safety

export interface FlagDTO {
    id: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
}

export interface FlagFullDTO extends FlagDTO {
    type: string;
    description: string;
    tag: string;
}

export interface LocationDTO {
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    coordinates: { lat: number; lng: number };
}

export interface EstablishmentDTO {
    id: string;
    companyName: string;
    location: LocationDTO;
    flags: FlagDTO[];
    logo: string;
    rating: number;
    isSponsored: boolean;
}

export interface EstablishmentDetailDTO extends EstablishmentDTO {
    ratingCount: number;
}

export interface RecommendedEstablishmentDTO extends EstablishmentDTO {
    score: number;
    flagMatchCount: number;
    distanceMeters: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface UserProfileDTO {
    id: string;
    name: string;
    email: string;
    birthDate: string;
    flags: string[];
    location?: LocationDTO;
    socialLinksEnabled: boolean;
    socialLinks?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        tiktok?: string;
        website?: string;
    };
    profilePhoto?: string;
}
