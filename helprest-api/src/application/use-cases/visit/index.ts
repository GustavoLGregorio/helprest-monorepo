import { ObjectId } from "mongodb";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import { Visit } from "@domain/entities/Visit";
import { NotFoundError } from "@shared/errors";
import type { CreateVisitInput, ListVisitsInput } from "@interface/validation/visit.schema";

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

        const visit = Visit.create({
            establishmentId,
            userId: new ObjectId(userId),
            date: input.date ? new Date(input.date) : new Date(),
            review: input.review,
            rating: input.rating,
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
        }));
    }
}
