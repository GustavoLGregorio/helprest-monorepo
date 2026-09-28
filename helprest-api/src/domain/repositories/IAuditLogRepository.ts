import { ObjectId } from "mongodb";
import type { AuditLog } from "../entities/AuditLog";

export interface FindAuditLogsFilter {
    adminId?: ObjectId;
    action?: string;
    targetEntity?: string;
    limit: number;
    skip: number;
}

export interface IAuditLogRepository {
    create(log: AuditLog): Promise<void>;
    findAll(filter: FindAuditLogsFilter): Promise<{ logs: AuditLog[]; total: number }>;
}
