import { ObjectId } from "mongodb";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
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

export class ListEstablishments {
    constructor(private readonly estRepo: IEstablishmentRepository) { }

    async execute(input: ListEstablishmentsInput) {
        const skip = (input.page - 1) * input.limit;
        const [establishments, total] = await Promise.all([
            this.estRepo.findAll(input.limit, skip),
            this.estRepo.count(),
        ]);

        return {
            data: establishments.map(this.toDTO),
            pagination: {
                page: input.page,
                limit: input.limit,
                total,
                totalPages: Math.ceil(total / input.limit),
            },
        };
    }

    private toDTO(est: Establishment) {
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
            flags: est.flags.map((f) => f.toHexString()),
            logo: est.logo,
            rating: est.rating,
            isSponsored: est.isSponsored,
        };
    }
}

export class GetEstablishment {
    constructor(private readonly estRepo: IEstablishmentRepository) { }

    async execute(id: string) {
        const est = await this.estRepo.findById(new ObjectId(id));
        if (!est) {
            throw new NotFoundError("Establishment", id);
        }

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
            flags: est.flags.map((f) => f.toHexString()),
            logo: est.logo,
            rating: est.rating,
            ratingCount: est.ratingCount,
            isSponsored: est.isSponsored,
        };
    }
}

export class GetRecommendedEstablishments {
    constructor(
        private readonly estRepo: IEstablishmentRepository,
        private readonly userRepo: IUserRepository,
    ) { }

    async execute(userId: string, lat: number, lng: number, limit: number = 20) {
        const user = await this.userRepo.findById(new ObjectId(userId));
        if (!user) {
            throw new NotFoundError("User", userId);
        }

        // Fetch establishments nearby (wide radius for recommendation pool)
        const establishments = await this.estRepo.findNearby({
            lat,
            lng,
            maxDistanceMeters: 50_000,
            limit: 100, // Fetch large pool, then rank
        });

        const ranked = RecommendationService.rank(establishments, {
            userFlagIds: [...user.flags],
            userLat: lat,
            userLng: lng,
        });

        return ranked.slice(0, limit).map((scored) => ({
            id: scored.establishment.id.toHexString(),
            companyName: scored.establishment.companyName,
            location: {
                state: scored.establishment.location.state,
                city: scored.establishment.location.city,
                coordinates: scored.establishment.location.coordinates,
            },
            flags: scored.establishment.flags.map((f) => f.toHexString()),
            logo: scored.establishment.logo,
            rating: scored.establishment.rating,
            isSponsored: scored.establishment.isSponsored,
            score: scored.score,
            flagMatchCount: scored.flagMatchCount,
            distanceMeters: scored.distanceMeters,
        }));
    }
}

export class GetNearbyEstablishments {
    constructor(private readonly estRepo: IEstablishmentRepository) { }

    async execute(input: NearbyEstablishmentsInput) {
        const establishments = await this.estRepo.findNearby({
            lat: input.lat,
            lng: input.lng,
            maxDistanceMeters: input.maxDistance,
            limit: input.limit,
        });

        return establishments.map((est) => ({
            id: est.id.toHexString(),
            companyName: est.companyName,
            location: {
                state: est.location.state,
                city: est.location.city,
                coordinates: est.location.coordinates,
            },
            flags: est.flags.map((f) => f.toHexString()),
            logo: est.logo,
            rating: est.rating,
            isSponsored: est.isSponsored,
        }));
    }
}

export class SearchEstablishments {
    constructor(private readonly estRepo: IEstablishmentRepository) { }

    async execute(input: SearchEstablishmentsInput) {
        const skip = (input.page - 1) * input.limit;
        const establishments = await this.estRepo.search(input.q, input.limit, skip);

        return establishments.map((est) => ({
            id: est.id.toHexString(),
            companyName: est.companyName,
            location: {
                state: est.location.state,
                city: est.location.city,
                coordinates: est.location.coordinates,
            },
            flags: est.flags.map((f) => f.toHexString()),
            logo: est.logo,
            rating: est.rating,
            isSponsored: est.isSponsored,
        }));
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
