import { ObjectId } from "mongodb";
import type { IAuditLogRepository } from "@domain/repositories/IAuditLogRepository";

export interface ListAuditLogsInput {
    adminId?: string;
    action?: string;
    targetEntity?: string;
    page?: number;
    limit?: number;
}

export class ListAuditLogs {
    constructor(private readonly auditLogRepo: IAuditLogRepository) {}

    async execute(input: ListAuditLogsInput = {}) {
        const page = input.page ?? 1;
        const limit = input.limit ?? 20;
        const skip = (page - 1) * limit;

        const adminObjectId = input.adminId && ObjectId.isValid(input.adminId)
            ? new ObjectId(input.adminId)
            : undefined;

        const { logs, total } = await this.auditLogRepo.findAll({
            adminId: adminObjectId,
            action: input.action,
            targetEntity: input.targetEntity,
            limit,
            skip,
        });

        return {
            data: logs.map((l) => ({
                id: l.id.toHexString(),
                adminId: l.adminId.toHexString(),
                adminEmail: l.adminEmail,
                action: l.action,
                targetEntity: l.targetEntity,
                targetId: l.targetId,
                details: l.details,
                ipAddress: l.ipAddress || null,
                createdAt: l.createdAt.toISOString(),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
