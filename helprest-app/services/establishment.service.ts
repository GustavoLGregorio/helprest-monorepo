import { apiFetch } from "./api.config";
import type {
    EstablishmentDTO,
    EstablishmentDetailDTO,
    RecommendedEstablishmentDTO,
    PaginatedResponse,
} from "@/types/api.types";

export async function listEstablishments(
    page: number = 1,
    limit: number = 20,
): Promise<PaginatedResponse<EstablishmentDTO>> {
    return apiFetch<PaginatedResponse<EstablishmentDTO>>("/establishments", {
        query: { page, limit },
    });
}

export async function getEstablishment(id: string): Promise<EstablishmentDetailDTO> {
    return apiFetch<EstablishmentDetailDTO>(`/establishments/${id}`);
}

export async function getRecommended(
    lat: number,
    lng: number,
    limit: number = 20,
): Promise<RecommendedEstablishmentDTO[]> {
    return apiFetch<RecommendedEstablishmentDTO[]>("/establishments/recommended", {
        query: { lat, lng, limit },
    });
}

export async function getNearby(
    lat: number,
    lng: number,
    maxDistance: number = 5000,
    limit: number = 20,
): Promise<EstablishmentDTO[]> {
    return apiFetch<EstablishmentDTO[]>("/establishments/nearby", {
        query: { lat, lng, maxDistance, limit },
    });
}

export async function searchEstablishments(
    q: string,
    page: number = 1,
    limit: number = 20,
): Promise<EstablishmentDTO[]> {
    return apiFetch<EstablishmentDTO[]>("/establishments/search", {
        query: { q, page, limit },
    });
}
