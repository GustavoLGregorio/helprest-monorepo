import { ObjectId } from "mongodb";
import type { Flag } from "../entities/Flag";

export interface IFlagRepository {
    findById(id: ObjectId): Promise<Flag | null>;
    findAll(): Promise<Flag[]>;
    findByIds(ids: ObjectId[]): Promise<Flag[]>;
    findByType(type: string): Promise<Flag[]>;
    create(flag: Flag): Promise<void>;
    delete(id: ObjectId): Promise<void>;
}
