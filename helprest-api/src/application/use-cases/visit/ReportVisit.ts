import { ObjectId } from "mongodb";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import { NotFoundError, ValidationError } from "@shared/errors";

export interface ReportVisitInput {
    userId: string;
    visitId: string;
    reason: string;
}

export class ReportVisit {
    constructor(private readonly visitRepo: IVisitRepository) {}

    async execute(input: ReportVisitInput): Promise<{ success: boolean }> {
        if (!ObjectId.isValid(input.visitId)) {
            throw new ValidationError("Invalid visit ID format");
        }
        if (!input.reason || input.reason.trim().length === 0) {
            throw new ValidationError("Reason is required to report a visit");
        }

        const visitObjectId = new ObjectId(input.visitId);
        const userObjectId = new ObjectId(input.userId);

        const visit = await this.visitRepo.findById(visitObjectId);
        if (!visit) {
            throw new NotFoundError("Visit not found");
        }

        await this.visitRepo.addReport(visitObjectId, userObjectId, input.reason.trim());
        return { success: true };
    }
}
