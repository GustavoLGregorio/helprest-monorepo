import type { IAuditLogRepository, FindAuditLogsFilter } from "@domain/repositories/IAuditLogRepository";
import { AuditLog } from "@domain/entities/AuditLog";
import { getAuditLogsCollection } from "../database/mongodb/collections";

export class MongoAuditLogRepository implements IAuditLogRepository {
    async create(log: AuditLog): Promise<void> {
        await getAuditLogsCollection().insertOne(log.toDocument());
    }

    async findAll(filter: FindAuditLogsFilter): Promise<{ logs: AuditLog[]; total: number }> {
        const query: Record<string, unknown> = {};

        if (filter.adminId) {
            query.adminId = filter.adminId;
        }

        if (filter.action) {
            query.action = filter.action;
        }

        if (filter.targetEntity) {
            query.targetEntity = filter.targetEntity;
        }

        const [docs, total] = await Promise.all([
            getAuditLogsCollection()
                .find(query)
                .sort({ createdAt: -1 })
                .skip(filter.skip)
                .limit(filter.limit)
                .toArray(),
            getAuditLogsCollection().countDocuments(query),
        ]);

        return {
            logs: docs.map((doc) => AuditLog.fromDocument(doc)),
            total,
        };
    }
}
