import { ObjectId } from "mongodb";
import { IUserFavoriteRepository } from "../../../domain/repositories/IUserFavoriteRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { ProductRepository } from "../../repositories/ProductRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IFlagRepository } from "../../../domain/repositories/IFlagRepository";

export class GetUserFavorites {
    constructor(
        private favoriteRepo: IUserFavoriteRepository,
        private establishmentRepo: IEstablishmentRepository,
        private productRepo: ProductRepository,
        private userRepo: IUserRepository,
        private flagRepo: IFlagRepository
    ) {}

    async execute(userId: string) {
        const targetUserId = new ObjectId(userId);
        const user = await this.userRepo.findById(targetUserId);
        const userFlagIds = user?.flags || [];

        const favorites = await this.favoriteRepo.findByUser(targetUserId);
        
        const estIds: ObjectId[] = [];
        const prodIds: ObjectId[] = [];
        
        for (const fav of favorites) {
            if (fav.type === "establishment") estIds.push(fav.referenceId);
            else if (fav.type === "product") prodIds.push(fav.referenceId);
        }

        const [establishments, products, flags] = await Promise.all([
            estIds.length > 0 ? this.establishmentRepo.findManyByIds(estIds) : [],
            prodIds.length > 0 ? this.productRepo.findManyByIds(prodIds) : [],
            this.flagRepo.findAll()
        ]);

        const allFlagsMap = new Map(flags.map(f => [f.id.toHexString(), f]));
        const userFlagStrings = new Set(userFlagIds.map(id => id.toHexString()));

        const countMatches = (entityFlagIds: ObjectId[]) => {
            if (!entityFlagIds) return 0;
            return entityFlagIds.filter(id => userFlagStrings.has(id.toHexString())).length;
        };

        establishments.sort((a, b) => {
            if (a.isSponsored && !b.isSponsored) return -1;
            if (!a.isSponsored && b.isSponsored) return 1;
            
            const matchA = countMatches(a.flags);
            const matchB = countMatches(b.flags);
            return matchB - matchA;
        });

        products.sort((a, b) => {
            const matchA = countMatches(a.flags);
            const matchB = countMatches(b.flags);
            return matchB - matchA; // Highest matches first
        });

        const mapFlags = (flagIds: any[]) => {
            return (flagIds || []).map(id => {
                const idStr = id && typeof id.toHexString === "function" ? id.toHexString() : String(id);
                const f = allFlagsMap.get(idStr);
                if (!f) return null;
                return {
                    id: f.id.toHexString(),
                    tag: f.tag,
                    identifier: f.identifier,
                    backgroundColor: f.backgroundColor,
                    textColor: f.textColor,
                    images: f.images
                };
            }).filter(Boolean);
        };

        return {
            establishments: establishments.map(e => ({
                id: e.id.toHexString(),
                companyName: e.companyName,
                logo: e.logo || undefined,
                rating: e.rating,
                ratingCount: e.ratingCount,
                isSponsored: e.isSponsored,
                flags: mapFlags(e.flags),
                location: e.location ? {
                    address: e.location.address,
                    city: e.location.city,
                    state: e.location.state,
                    neighborhood: e.location.neighborhood,
                    coordinates: e.location.coordinates?.coordinates ? {
                        lat: e.location.coordinates.coordinates[1],
                        lng: e.location.coordinates.coordinates[0],
                    } : null
                } : null
            })),
            products: products.map(p => ({
                id: p.id.toHexString(),
                establishmentId: p.establishmentId?.toHexString() || "", // Needed for redirection
                name: p.name,
                description: p.description,
                price: p.price,
                imageUrl: p.imageUrl,
                ingredients: p.ingredients,
                flags: mapFlags(p.flags),
            }))
        };
    }
}
