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
            .find({ userId, isModerated: { $ne: true } })
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
            .find({ establishmentId, isModerated: { $ne: true } })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Visit.fromDocument(doc));
    }

    async create(visit: Visit): Promise<void> {
        await getVisitsCollection().insertOne(visit.toDocument());
    }

    async update(visit: Visit): Promise<void> {
        const doc = visit.toDocument();
        const { _id: _, ...updateData } = doc;
        await getVisitsCollection().updateOne(
            { _id: visit.id },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
    }

    async delete(id: ObjectId): Promise<void> {
        await getVisitsCollection().deleteOne({ _id: id });
    }

    async countByEstablishment(establishmentId: ObjectId): Promise<number> {
        return getVisitsCollection().countDocuments({ establishmentId, isModerated: { $ne: true } });
    }

    async count(): Promise<number> {
        return getVisitsCollection().countDocuments();
    }

    async findRecentWithPhotos(limit: number, skip: number): Promise<Visit[]> {
        const docs = await getVisitsCollection()
            .find({ photoUrls: { $exists: true, $not: { $size: 0 } }, isModerated: { $ne: true } })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Visit.fromDocument(doc));
    }

    async findReported(limit: number, skip: number): Promise<Visit[]> {
        const docs = await getVisitsCollection()
            .find({ isReported: true })
            .sort({ reportCount: -1, date: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Visit.fromDocument(doc));
    }

    async moderate(id: ObjectId, isModerated: boolean, reason?: string): Promise<void> {
        await getVisitsCollection().updateOne(
            { _id: id },
            {
                $set: {
                    isModerated,
                    moderationReason: isModerated ? (reason ?? "Moderado por administrador") : null,
                    updatedAt: new Date(),
                },
            }
        );
    }

    async addReport(id: ObjectId, userId: ObjectId, reason: string): Promise<void> {
        const newReport = {
            userId,
            reason,
            createdAt: new Date(),
        };
        await getVisitsCollection().updateOne(
            { _id: id },
            {
                $set: { isReported: true },
                $inc: { reportCount: 1 },
                $push: { reports: newReport as any },
            }
        );
    }
}
