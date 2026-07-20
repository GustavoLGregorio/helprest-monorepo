import type { Collection, Document } from "mongodb";
import { getDatabase } from "./connection";

export const COLLECTION_NAMES = {
    USERS: "users",
    ESTABLISHMENTS: "establishments",
    FLAGS: "flags",
    VISITS: "visits",
    PRODUCTS: "products",
    USER_FAVORITES: "user_favorites",
} as const;

export function getUsersCollection(): Collection<Document> {
    return getDatabase().collection(COLLECTION_NAMES.USERS);
}

export function getEstablishmentsCollection(): Collection<Document> {
    return getDatabase().collection(COLLECTION_NAMES.ESTABLISHMENTS);
}

export function getFlagsCollection(): Collection<Document> {
    return getDatabase().collection(COLLECTION_NAMES.FLAGS);
}

export function getVisitsCollection(): Collection<Document> {
    return getDatabase().collection(COLLECTION_NAMES.VISITS);
}

export function getProductsCollection(): Collection<Document> {
    return getDatabase().collection(COLLECTION_NAMES.PRODUCTS);
}

export function getUserFavoritesCollection(): Collection<Document> {
    return getDatabase().collection(COLLECTION_NAMES.USER_FAVORITES);
}
