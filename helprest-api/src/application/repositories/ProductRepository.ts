import { ObjectId } from "mongodb";
import type { Product } from "../../domain/entities/Product";

export interface ProductRepository {
    save(product: Product): Promise<void>;
    findById(id: ObjectId): Promise<Product | null>;
    findManyByIds(ids: ObjectId[]): Promise<Product[]>;
    findByEstablishmentId(establishmentId: ObjectId): Promise<Product[]>;
    delete(id: ObjectId): Promise<void>;
}
