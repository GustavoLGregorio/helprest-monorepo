import { ObjectId } from "mongodb";
import type { Establishment } from "../entities/Establishment";

export interface FindNearbyOptions {
    lng: number;
    lat: number;
    maxDistanceMeters: number;
    flagIds?: ObjectId[];
    limit?: number;
    skip?: number;
}

export interface FindByFlagsOptions {
    flagIds: ObjectId[];
    limit?: number;
    skip?: number;
}

export interface IEstablishmentRepository {
    findById(id: ObjectId): Promise<Establishment | null>;
    findAll(limit: number, skip: number): Promise<Establishment[]>;
    findNearby(options: FindNearbyOptions): Promise<Establishment[]>;
    findByFlags(options: FindByFlagsOptions): Promise<Establishment[]>;
    findSponsored(limit: number): Promise<Establishment[]>;
    search(query: string, limit: number, skip: number): Promise<Establishment[]>;
    create(establishment: Establishment): Promise<void>;
    update(establishment: Establishment): Promise<void>;
    delete(id: ObjectId): Promise<void>;
    count(): Promise<number>;
}
