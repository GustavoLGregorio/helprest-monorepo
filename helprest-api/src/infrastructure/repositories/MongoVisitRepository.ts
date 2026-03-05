import { ObjectId } from "mongodb";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import { Visit } from "@domain/entities/Visit";
import { getVisitsCollection } from "../database/mongodb/collections";

export class MongoVisitRepository implements IVisitRepository {
    async findById(id: ObjectId): Promise<Visit | null> {
        const doc = await getVisitsCollection().findOne({ _id: id });
        return doc ? Visit.fromDocument(doc) : null;
    }

    async findByUserId(userId: ObjectId, limit: number, skip: number): Promise<Visit[]> {
        const docs = await getVisitsCollection()
            .find({ userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Visit.fromDocument(doc));
    }

    async findByEstablishmentId(
        establishmentId: ObjectId,
        limit: number,
        skip: number,
    ): Promise<Visit[]> {
        const docs = await getVisitsCollection()
            .find({ establishmentId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Visit.fromDocument(doc));
    }

    async create(visit: Visit): Promise<void> {
        await getVisitsCollection().insertOne(visit.toDocument());
    }

    async delete(id: ObjectId): Promise<void> {
        await getVisitsCollection().deleteOne({ _id: id });
    }

    async countByEstablishment(establishmentId: ObjectId): Promise<number> {
        return getVisitsCollection().countDocuments({ establishmentId });
    }
}
