import { ObjectId } from "mongodb";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import { Flag } from "@domain/entities/Flag";
import { getFlagsCollection } from "../database/mongodb/collections";

export class MongoFlagRepository implements IFlagRepository {
    async findById(id: ObjectId): Promise<Flag | null> {
        const doc = await getFlagsCollection().findOne({ _id: id });
        return doc ? Flag.fromDocument(doc) : null;
    }

    async findAll(): Promise<Flag[]> {
        const docs = await getFlagsCollection().find().toArray();
        return docs.map((doc) => Flag.fromDocument(doc));
    }

    async findByIds(ids: ObjectId[]): Promise<Flag[]> {
        const docs = await getFlagsCollection()
            .find({ _id: { $in: ids } })
            .toArray();
        return docs.map((doc) => Flag.fromDocument(doc));
    }

    async findByType(type: string): Promise<Flag[]> {
        const docs = await getFlagsCollection().find({ type }).toArray();
        return docs.map((doc) => Flag.fromDocument(doc));
    }

    async create(flag: Flag): Promise<void> {
        await getFlagsCollection().insertOne(flag.toDocument());
    }

    async delete(id: ObjectId): Promise<void> {
        await getFlagsCollection().deleteOne({ _id: id });
    }
}
