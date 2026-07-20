import { ObjectId } from "mongodb";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import { Product } from "@domain/entities/Product";
import { getProductsCollection } from "../database/mongodb/collections";

export class MongoProductRepository implements ProductRepository {
    async save(product: Product): Promise<void> {
        await getProductsCollection().updateOne(
            { _id: product.id },
            { $set: product.toDocument() },
            { upsert: true }
        );
    }

    async findById(id: ObjectId): Promise<Product | null> {
        const doc = await getProductsCollection().findOne({ _id: id });
        if (!doc) return null;
        return Product.fromDocument(doc);
    }

    async findManyByIds(ids: ObjectId[]): Promise<Product[]> {
        const docs = await getProductsCollection()
            .find({ _id: { $in: ids } })
            .toArray();
        return docs.map((doc) => Product.fromDocument(doc));
    }

    async findByEstablishmentId(establishmentId: ObjectId): Promise<Product[]> {
        const docs = await getProductsCollection()
            .find({ establishmentId, isActive: true })
            .sort({ name: 1 })
            .toArray();
        return docs.map((doc) => Product.fromDocument(doc));
    }

    async delete(id: ObjectId): Promise<void> {
        await getProductsCollection().deleteOne({ _id: id });
    }

    async ensureIndexes(): Promise<void> {
        // Optimization for finding active products per establishment
        const idxName = "idx_products_est_active";
        const hasIdx = await getProductsCollection().indexExists(idxName).catch(() => false);
        if (!hasIdx) {
            await getProductsCollection().createIndex(
                { establishmentId: 1, isActive: 1 },
                { name: idxName }
            );
        } else {
            console.log(`Index skipped (already exists): ${idxName}`);
        }
    }
}
