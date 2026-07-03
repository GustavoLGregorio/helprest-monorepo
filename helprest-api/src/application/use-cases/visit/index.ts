import { ObjectId } from "mongodb";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import { Visit } from "@domain/entities/Visit";
import { NotFoundError, ValidationError } from "@shared/errors";
import type { CreateVisitInput, ListVisitsInput } from "@interface/validation/visit.schema";
import { RecommendationService } from "@domain/services/RecommendationService";

export class CreateVisit {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly estRepo: IEstablishmentRepository,
    ) { }

    async execute(userId: string, input: CreateVisitInput) {
        const establishmentId = new ObjectId(input.establishmentId);

        const establishment = await this.estRepo.findById(establishmentId);
        if (!establishment) {
            throw new NotFoundError("Establishment", input.establishmentId);
        }

        // Geofencing validation: only check if photos are uploaded
        if (input.photoUrls && input.photoUrls.length > 0) {
            if (!input.coordinates) {
                throw new ValidationError("Coordenadas de geolocalização são obrigatórias para publicar fotos da visita", {
                    coordinates: ["Coordenadas GPS ausentes"]
                });
            }

            const distance = RecommendationService.haversineDistance(
                input.coordinates.lat,
                input.coordinates.lng,
                establishment.location.coordinates.lat,
                establishment.location.coordinates.lng
            );

            if (distance > 100) {
                throw new ValidationError("Você precisa estar a menos de 100 metros do estabelecimento para publicar fotos da visita", {
                    coordinates: [`Distância de ${Math.round(distance)}m excede o limite de 100m`]
                });
            }
        }

        const visit = Visit.create({
            establishmentId,
            userId: new ObjectId(userId),
            date: input.date ? new Date(input.date) : new Date(),
            review: input.review,
            rating: input.rating,
            photoUrls: input.photoUrls,
        });

        await this.visitRepo.create(visit);

        // Recalculate establishment rating
        const updatedEstablishment = establishment.withNewRating(input.rating);
        await this.estRepo.update(updatedEstablishment);

        return { id: visit.id.toHexString() };
    }
}

export class ListUserVisits {
    constructor(private readonly visitRepo: IVisitRepository) { }

    async execute(userId: string, input: ListVisitsInput) {
        const skip = (input.page - 1) * input.limit;
        const visits = await this.visitRepo.findByUserId(
            new ObjectId(userId),
            input.limit,
            skip,
        );

        return visits.map((v) => ({
            id: v.id.toHexString(),
            establishmentId: v.establishmentId.toHexString(),
            date: v.date,
            review: v.review,
            rating: v.rating,
            photoUrls: [...v.photoUrls],
        }));
    }
}

export class GetEstablishmentVisits {
    constructor(private readonly visitRepo: IVisitRepository) { }

    async execute(establishmentId: string, input: ListVisitsInput) {
        const skip = (input.page - 1) * input.limit;
        const visits = await this.visitRepo.findByEstablishmentId(
            new ObjectId(establishmentId),
            input.limit,
            skip,
        );

        return visits.map((v) => ({
            id: v.id.toHexString(),
            userId: v.userId.toHexString(),
            date: v.date,
            review: v.review,
            rating: v.rating,
            photoUrls: [...v.photoUrls],
        }));
    }
}
