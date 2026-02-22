import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { getUsersCollection } from "../database/mongodb/collections";

export class MongoUserRepository implements IUserRepository {
    async findById(id: ObjectId): Promise<User | null> {
        const doc = await getUsersCollection().findOne({ _id: id });
        return doc ? User.fromDocument(doc) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const doc = await getUsersCollection().findOne({ email });
        return doc ? User.fromDocument(doc) : null;
    }

    async create(user: User): Promise<void> {
        await getUsersCollection().insertOne(user.toDocument());
    }

    async update(user: User): Promise<void> {
        const doc = user.toDocument();
        const { _id, ...updateData } = doc;
        await getUsersCollection().updateOne(
            { _id: user.id },
            { $set: { ...updateData, updatedAt: new Date() } },
        );
    }

    async delete(id: ObjectId): Promise<void> {
        await getUsersCollection().deleteOne({ _id: id });
    }
}
