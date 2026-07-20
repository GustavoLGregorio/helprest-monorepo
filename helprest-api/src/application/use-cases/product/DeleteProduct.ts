import { ObjectId } from "mongodb";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import { NotFoundError, ForbiddenError } from "@shared/errors";

export class DeleteProduct {
    constructor(
        private readonly productRepo: ProductRepository,
        private readonly establishmentRepo: IEstablishmentRepository,
    ) { }

    async execute(adminId: string, productId: string) {
        const productObjectId = new ObjectId(productId);

        const product = await this.productRepo.findById(productObjectId);
        if (!product) {
            throw new NotFoundError("Product", productId);
        }

        const establishment = await this.establishmentRepo.findById(product.establishmentId);
        if (!establishment) {
            throw new NotFoundError("Establishment", product.establishmentId.toHexString());
        }

        // Validate that the authenticated user is the admin of the establishment
        if (!establishment.adminId || establishment.adminId.toHexString() !== adminId) {
            throw new ForbiddenError("Você não tem permissão para gerenciar este estabelecimento");
        }

        await this.productRepo.delete(productObjectId);

        return { success: true };
    }
}
