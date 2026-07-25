import { ObjectId } from "mongodb";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import { Establishment } from "@domain/entities/Establishment";
import { Location } from "@domain/value-objects/Location";
import { RecommendationService } from "@domain/services/RecommendationService";
import { NotFoundError, ValidationError } from "@shared/errors";
import type {
    CreateEstablishmentInput,
    ListEstablishmentsInput,
    NearbyEstablishmentsInput,
    SearchEstablishmentsInput,
} from "@interface/validation/establishment.schema";

// ── Shared DTO builder ──

interface FlagDTO {
    id: string;
    tag: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
    images: {
        tag: string | null;
        pin: string | null;
    };
}

async function populateFlags(
    flagIds: ReadonlyArray<ObjectId>,
    flagRepo: IFlagRepository,
): Promise<FlagDTO[]> {
    if (flagIds.length === 0) return [];
    const flags = await flagRepo.findByIds([...flagIds]);
    return flags.map((f) => ({
        id: f.id.toHexString(),
        tag: f.tag,
        identifier: f.identifier,
        backgroundColor: f.backgroundColor,
        textColor: f.textColor,
        images: f.images,
    }));
}

function toEstablishmentDTO(est: Establishment, flags: FlagDTO[]) {
    return {
        id: est.id.toHexString(),
        companyName: est.companyName,
        location: {
            state: est.location.state,
            city: est.location.city,
            neighborhood: est.location.neighborhood,
            address: est.location.address,
            coordinates: est.location.coordinates,
        },
        flags,
        logo: est.logo,
        rating: est.rating,
        isSponsored: est.isSponsored,
    };
}

// ── Use Cases ──

export class ListEstablishments {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly flagRepo: IFlagRepository,
    ) { }

    async execute(input: ListEstablishmentsInput) {
        const skip = (input.page - 1) * input.limit;
        const [establishments, total] = await Promise.all([
            this.estRepo.findAll(input.limit, skip),
            this.estRepo.count(),
        ]);

        const data = await Promise.all(
            establishments.map(async (est) => {
                const flags = await populateFlags(est.flags, this.flagRepo);
                return toEstablishmentDTO(est, flags);
            }),
        );

        return {
            data,
            pagination: {
                page: input.page,
                limit: input.limit,
                total,
                totalPages: Math.ceil(total / input.limit),
            },
        };
    }
}

export class GetEstablishment {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly flagRepo: IFlagRepository,
        private readonly productRepo: ProductRepository,
        private readonly userRepo?: IUserRepository,
    ) { }

    async execute(id: string, userId?: string) {
        if (!ObjectId.isValid(id)) {
            throw new ValidationError("ID de estabelecimento inválido");
        }
        const est = await this.estRepo.findById(new ObjectId(id));
        if (!est) {
            throw new NotFoundError("Establishment", id);
        }

        const flags = await populateFlags(est.flags, this.flagRepo);
        const productsRaw = await this.productRepo.findByEstablishmentId(est.id);

        let userFlags: string[] = [];
        if (userId && this.userRepo) {
            if (!ObjectId.isValid(userId)) {
                throw new ValidationError("ID de usuário inválido");
            }
            const user = await this.userRepo.findById(new ObjectId(userId));
            if (user) {
                userFlags = user.flags.map((f) => f.toHexString());
            }
        }

        const products = await Promise.all(
            productsRaw.map(async (p) => {
                const pFlags = await populateFlags(p.flags, this.flagRepo);
                const pFlagIds = p.flags.map((f) => f.toHexString());
                const matchCount = userFlags.length > 0
                    ? pFlagIds.filter((fid) => userFlags.includes(fid)).length
                    : 0;

                return {
                    id: p.id.toHexString(),
                    flags: pFlags,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    imageUrl: p.imageUrl,
                    ingredients: [...p.ingredients],
                    isActive: p.isActive,
                    matchCount,
                };
            }),
        );

        // Sort products: active ones first, then by matchCount descending (most matching user dietary restrictions first)
        products.sort((a, b) => {
            if (a.isActive !== b.isActive) {
                return a.isActive ? -1 : 1;
            }
            return b.matchCount - a.matchCount;
        });

        return {
            ...toEstablishmentDTO(est, flags),
            products,
            ratingCount: est.ratingCount,
        };
    }
}

export class GetRecommendedEstablishments {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly userRepo: IUserRepository,
        private readonly flagRepo: IFlagRepository,
    ) { }

    async execute(userId: string, lat: number, lng: number, limit: number = 20) {
        const user = await this.userRepo.findById(new ObjectId(userId));
        if (!user) {
            throw new NotFoundError("User", userId);
        }

        const establishments = await this.estRepo.findNearby({
            lat,
            lng,
            maxDistanceMeters: 50_000,
            limit: 100,
        });

        const ranked = RecommendationService.rank(establishments, {
            userFlagIds: [...user.flags],
            userLat: lat,
            userLng: lng,
        });

        return Promise.all(
            ranked.slice(0, limit).map(async (scored) => {
                const flags = await populateFlags(scored.establishment.flags, this.flagRepo);
                return {
                    ...toEstablishmentDTO(scored.establishment, flags),
                    score: scored.score,
                    flagMatchCount: scored.flagMatchCount,
                    distanceMeters: scored.distanceMeters,
                };
            }),
        );
    }
}

export class GetNearbyEstablishments {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly flagRepo: IFlagRepository,
    ) { }

    async execute(input: NearbyEstablishmentsInput) {
        const establishments = await this.estRepo.findNearby({
            lat: input.lat,
            lng: input.lng,
            maxDistanceMeters: input.maxDistance,
            limit: input.limit,
        });

        return Promise.all(
            establishments.map(async (est) => {
                const flags = await populateFlags(est.flags, this.flagRepo);
                return toEstablishmentDTO(est, flags);
            }),
        );
    }
}

export class SearchEstablishments {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly flagRepo: IFlagRepository,
    ) { }

    async execute(input: SearchEstablishmentsInput) {
        const skip = (input.page - 1) * input.limit;
        const establishments = await this.estRepo.search(input.q, input.limit, skip);

        return Promise.all(
            establishments.map(async (est) => {
                const flags = await populateFlags(est.flags, this.flagRepo);
                return toEstablishmentDTO(est, flags);
            }),
        );
    }
}

export class CreateEstablishment {
    constructor(private readonly estRepo: IEstablishmentRepository) { }

    async execute(adminId: string, input: CreateEstablishmentInput) {
        const location = Location.create(input.location);
        const flagIds = input.flagIds.map((id) => new ObjectId(id));

        const establishment = Establishment.create({
            companyName: input.companyName,
            location,
            flags: flagIds,
            logo: input.logo,
            rating: 0,
            ratingCount: 0,
            ratingTotal: 0,
            adminId: new ObjectId(adminId),
        });

        await this.estRepo.create(establishment);
        return { id: establishment.id.toHexString() };
    }
}

export class GetEstablishmentByAdmin {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly flagRepo: IFlagRepository,
        private readonly productRepo: ProductRepository,
    ) { }

    async execute(adminId: string) {
        if (!ObjectId.isValid(adminId)) {
            throw new ValidationError("ID de administrador inválido");
        }
        const est = await this.estRepo.findByAdminId(new ObjectId(adminId));
        if (!est) {
            throw new NotFoundError("Establishment", `admin ${adminId}`);
        }

        const flags = await populateFlags(est.flags, this.flagRepo);
        const productsRaw = await this.productRepo.findByEstablishmentId(est.id);
        const products = await Promise.all(productsRaw.map(async (p) => {
            const pFlags = await populateFlags(p.flags, this.flagRepo);
            return {
                id: p.id.toHexString(),
                flags: pFlags,
                name: p.name,
                description: p.description,
                price: p.price,
                imageUrl: p.imageUrl,
                ingredients: [...p.ingredients],
                isActive: p.isActive,
            };
        }));

        return {
            ...toEstablishmentDTO(est, flags),
            products,
            ratingCount: est.ratingCount,
        };
    }
}
