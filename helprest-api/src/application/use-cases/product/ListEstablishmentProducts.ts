import { ObjectId } from "mongodb";
import type { ProductRepository } from "../../repositories/ProductRepository";
import { EstablishmentRepository } from "../../repositories/EstablishmentRepository";
import { NotFoundError } from "@shared/errors";

export interface ProductDTO {
    id: string;
    establishmentId: string;
    flags: string[];
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    ingredients: string[];
}

export class ListEstablishmentProducts {
    constructor(
        private productRepo: ProductRepository,
        private establishmentRepo: EstablishmentRepository
    ) { }

    async execute(establishmentId: string): Promise<ProductDTO[]> {
        let estObjectId: ObjectId;
        try {
            estObjectId = new ObjectId(establishmentId);
        } catch {
            throw new NotFoundError("Estabelecimento não encontrado");
        }

        const establishment = await this.establishmentRepo.findById(estObjectId);
        if (!establishment) {
            throw new NotFoundError("Estabelecimento não encontrado");
        }

        const products = await this.productRepo.findByEstablishmentId(estObjectId);

        return products.map((product) => ({
            id: product.id.toHexString(),
            establishmentId: product.establishmentId.toHexString(),
            flags: product.flags.map(f => f.toHexString()),
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            ingredients: [...product.ingredients],
        }));
    }
}
