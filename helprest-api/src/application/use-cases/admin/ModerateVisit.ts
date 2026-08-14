import { ObjectId } from "mongodb";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import { NotFoundError, ValidationError } from "@shared/errors";

export interface ModerateVisitInput {
    visitId: string;
    isModerated: boolean;
    reason?: string;
}

export class ModerateVisit {
    constructor(private readonly visitRepo: IVisitRepository) {}

    async execute(input: ModerateVisitInput): Promise<{ success: boolean; isModerated: boolean }> {
        if (!ObjectId.isValid(input.visitId)) {
            throw new ValidationError("Invalid visit ID format");
        }

        const visitObjectId = new ObjectId(input.visitId);
        const visit = await this.visitRepo.findById(visitObjectId);
        if (!visit) {
            throw new NotFoundError("Visit not found");
        }

        await this.visitRepo.moderate(visitObjectId, input.isModerated, input.reason);
        return { success: true, isModerated: input.isModerated };
    }
}
