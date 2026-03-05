import { ObjectId } from "mongodb";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { Establishment } from "@domain/entities/Establishment";
import { Location } from "@domain/value-objects/Location";
import { RecommendationService } from "@domain/services/RecommendationService";
import { NotFoundError } from "@shared/errors";
import type {
    CreateEstablishmentInput,
    ListEstablishmentsInput,
    NearbyEstablishmentsInput,
    SearchEstablishmentsInput,
} from "@interface/validation/establishment.schema";
import type { Flag } from "@domain/entities/Flag";

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
    ) { }

    async execute(id: string) {
        const est = await this.estRepo.findById(new ObjectId(id));
        if (!est) {
            throw new NotFoundError("Establishment", id);
        }

        const flags = await populateFlags(est.flags, this.flagRepo);
        return {
            ...toEstablishmentDTO(est, flags),
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

    async execute(input: CreateEstablishmentInput) {
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
        });

        await this.estRepo.create(establishment);
        return { id: establishment.id.toHexString() };
    }
}
