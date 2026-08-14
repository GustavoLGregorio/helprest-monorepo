import { ObjectId } from "mongodb";
import type { User } from "../entities/User";

export interface FindUsersFilter {
    query?: string;
    role?: string;
    status?: string;
    limit: number;
    skip: number;
}

export interface IUserRepository {
    findById(id: ObjectId): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    findAll(filter: FindUsersFilter): Promise<{ users: User[]; total: number }>;
    create(user: User): Promise<void>;
    update(user: User): Promise<void>;
    delete(id: ObjectId): Promise<void>;
    count(): Promise<number>;
    getFlagDistribution(): Promise<Array<{ flagId: ObjectId; count: number }>>;
}
