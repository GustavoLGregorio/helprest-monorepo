import { ObjectId } from "mongodb";
import type { User } from "../entities/User";

export interface IUserRepository {
    findById(id: ObjectId): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    create(user: User): Promise<void>;
    update(user: User): Promise<void>;
    delete(id: ObjectId): Promise<void>;
}

