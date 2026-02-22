import { apiFetch } from "./api.config";
import type { FlagFullDTO } from "@/types/api.types";

export async function listFlags(): Promise<FlagFullDTO[]> {
    return apiFetch<FlagFullDTO[]>("/flags", { authenticated: false });
}
