import { ObjectId } from "mongodb";
import type {
    IEstablishmentRepository,
    FindNearbyOptions,
    FindByFlagsOptions,
} from "@domain/repositories/IEstablishmentRepository";
import { Establishment } from "@domain/entities/Establishment";
import { getEstablishmentsCollection } from "../database/mongodb/collections";

export class MongoEstablishmentRepository implements IEstablishmentRepository {
    async findById(id: ObjectId): Promise<Establishment | null> {
        const doc = await getEstablishmentsCollection().findOne({ _id: id });
        return doc ? Establishment.fromDocument(doc) : null;
    }

    async findManyByIds(ids: ObjectId[]): Promise<Establishment[]> {
        const docs = await getEstablishmentsCollection()
            .find({ _id: { $in: ids } })
            .toArray();
        return docs.map((doc) => Establishment.fromDocument(doc));
    }

    async findAll(limit: number, skip: number): Promise<Establishment[]> {
        const docs = await getEstablishmentsCollection()
            .find()
            .sort({ rating: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Establishment.fromDocument(doc));
    }

    async findNearby(options: FindNearbyOptions): Promise<Establishment[]> {
        const pipeline: Record<string, unknown>[] = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [options.lng, options.lat] },
                    distanceField: "distance",
                    maxDistance: options.maxDistanceMeters,
                    spherical: true,
                },
            },
        ];

        if (options.flagIds && options.flagIds.length > 0) {
            pipeline.push({
                $match: { flags: { $in: options.flagIds } },
            });
        }

        pipeline.push(
            { $skip: options.skip ?? 0 },
            { $limit: options.limit ?? 20 },
        );

        const docs = await getEstablishmentsCollection()
            .aggregate(pipeline)
            .toArray();

        return docs.map((doc) => Establishment.fromDocument(doc));
    }

    async findByFlags(options: FindByFlagsOptions): Promise<Establishment[]> {
        const docs = await getEstablishmentsCollection()
            .find({ flags: { $in: options.flagIds } })
            .sort({ rating: -1 })
            .skip(options.skip ?? 0)
            .limit(options.limit ?? 20)
            .toArray();

        return docs.map((doc) => Establishment.fromDocument(doc));
    }

    async findSponsored(limit: number): Promise<Establishment[]> {
        const docs = await getEstablishmentsCollection()
            .find({ isSponsored: true })
            .sort({ rating: -1 })
            .limit(limit)
            .toArray();

        return docs.map((doc) => Establishment.fromDocument(doc));
    }

    async search(query: string, limit: number, skip: number): Promise<Establishment[]> {
        const docs = await getEstablishmentsCollection()
            .find({ $text: { $search: query } })
            .sort({ score: { $meta: "textScore" } })
            .skip(skip)
            .limit(limit)
            .toArray();

        return docs.map((doc) => Establishment.fromDocument(doc));
    }

    async create(establishment: Establishment): Promise<void> {
        await getEstablishmentsCollection().insertOne(establishment.toDocument());
    }

    async update(establishment: Establishment): Promise<void> {
        const doc = establishment.toDocument();
        const { _id, ...updateData } = doc;
        await getEstablishmentsCollection().updateOne(
            { _id: establishment.id },
            { $set: { ...updateData, updatedAt: new Date() } },
        );
    }

    async delete(id: ObjectId): Promise<void> {
        await getEstablishmentsCollection().deleteOne({ _id: id });
    }

    async count(): Promise<number> {
        return getEstablishmentsCollection().countDocuments();
    }
}
