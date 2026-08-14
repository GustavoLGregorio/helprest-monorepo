import { ObjectId } from "mongodb";
import type { Visit } from "../entities/Visit";

export interface IVisitRepository {
    findById(id: ObjectId): Promise<Visit | null>;
    findByUserId(userId: ObjectId, limit: number, skip: number): Promise<Visit[]>;
    findByEstablishmentId(establishmentId: ObjectId, limit: number, skip: number): Promise<Visit[]>;
    create(visit: Visit): Promise<void>;
    update(visit: Visit): Promise<void>;
    delete(id: ObjectId): Promise<void>;
    countByEstablishment(establishmentId: ObjectId): Promise<number>;
    count(): Promise<number>;
    findRecentWithPhotos(limit: number, skip: number): Promise<Visit[]>;
    findReported(limit: number, skip: number): Promise<Visit[]>;
    moderate(id: ObjectId, isModerated: boolean, reason?: string): Promise<void>;
    addReport(id: ObjectId, userId: ObjectId, reason: string): Promise<void>;
}
