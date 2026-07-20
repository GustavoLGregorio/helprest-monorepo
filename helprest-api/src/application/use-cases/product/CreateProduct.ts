import { ObjectId } from "mongodb";
import { Product } from "@domain/entities/Product";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import { NotFoundError, ForbiddenError } from "@shared/errors";
import type { CreateProductInput } from "@interface/validation/product.schema";

export class CreateProduct {
    constructor(
        private readonly productRepo: ProductRepository,
        private readonly establishmentRepo: IEstablishmentRepository,
    ) { }

    async execute(adminId: string, input: CreateProductInput) {
        const establishmentId = new ObjectId(input.establishmentId);

        const establishment = await this.establishmentRepo.findById(establishmentId);
        if (!establishment) {
            throw new NotFoundError("Establishment", input.establishmentId);
        }

        // Validate that the authenticated user is the admin of the establishment
        if (!establishment.adminId || establishment.adminId.toHexString() !== adminId) {
            throw new ForbiddenError("Você não tem permissão para gerenciar este estabelecimento");
        }

        const flagIds = input.flags ? input.flags.map(id => new ObjectId(id)) : [];

        const product = Product.create({
            establishmentId,
            name: input.name,
            description: input.description,
            price: input.price,
            imageUrl: input.imageUrl,
            ingredients: input.ingredients,
            flags: flagIds,
            isActive: true,
        });

        await this.productRepo.save(product);

        return { id: product.id.toHexString() };
    }
}
