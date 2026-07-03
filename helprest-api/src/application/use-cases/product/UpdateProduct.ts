import { ObjectId } from "mongodb";
import { Product } from "@domain/entities/Product";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import { NotFoundError, ForbiddenError } from "@shared/errors";
import type { UpdateProductInput } from "@interface/validation/product.schema";

export class UpdateProduct {
    constructor(
        private readonly productRepo: ProductRepository,
        private readonly establishmentRepo: IEstablishmentRepository,
    ) { }

    async execute(adminId: string, productId: string, input: UpdateProductInput) {
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

        const flagIds = input.flags 
            ? input.flags.map(id => new ObjectId(id)) 
            : [...product.flags];

        const updatedProduct = Product.create({
            id: product.id,
            establishmentId: product.establishmentId,
            name: input.name ?? product.name,
            description: input.description ?? product.description,
            price: input.price ?? product.price,
            imageUrl: input.imageUrl !== undefined ? input.imageUrl : product.imageUrl,
            ingredients: input.ingredients ? [...input.ingredients] : [...product.ingredients],
            flags: flagIds,
            isActive: input.isActive ?? product.isActive,
            createdAt: product.createdAt,
            updatedAt: new Date(),
        });

        await this.productRepo.save(updatedProduct);

        return { id: updatedProduct.id.toHexString() };
    }
}
