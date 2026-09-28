import { describe, expect, it, mock } from "bun:test";
import { ListAuditLogs } from "../../../../../src/application/use-cases/admin/ListAuditLogs";
import type { IAuditLogRepository } from "../../../../../src/domain/repositories/IAuditLogRepository";
import { AuditLog } from "../../../../../src/domain/entities/AuditLog";
import { ObjectId } from "mongodb";

describe("ListAuditLogs Use Case Unit Tests", () => {
    const adminId = new ObjectId();
    const mockLog = AuditLog.create({
        adminId,
        adminEmail: "admin@helprest.com",
        action: "BAN_USER",
        targetEntity: "User",
        targetId: new ObjectId().toHexString(),
        details: { reason: "Spam behavior" },
    });

    it("should list audit logs with default pagination", async () => {
        const mockAuditLogRepo: IAuditLogRepository = {
            create: mock(async () => {}),
            findAll: mock(async (filter) => {
                expect(filter.limit).toBe(20);
                expect(filter.skip).toBe(0);
                return { logs: [mockLog], total: 1 };
            }),
        };

        const useCase = new ListAuditLogs(mockAuditLogRepo);
        const result = await useCase.execute();

        expect(result.data.length).toBe(1);
        expect(result.data[0]!.action).toBe("BAN_USER");
        expect(result.data[0]!.adminEmail).toBe("admin@helprest.com");
        expect(result.pagination).toEqual({
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
        });
    });

    it("should filter audit logs by adminId, action, and targetEntity with custom page and limit", async () => {
        const mockAuditLogRepo: IAuditLogRepository = {
            create: mock(async () => {}),
            findAll: mock(async (filter) => {
                expect(filter.adminId?.toHexString()).toBe(adminId.toHexString());
                expect(filter.action).toBe("BAN_USER");
                expect(filter.targetEntity).toBe("User");
                expect(filter.limit).toBe(10);
                expect(filter.skip).toBe(10);
                return { logs: [mockLog], total: 25 };
            }),
        };

        const useCase = new ListAuditLogs(mockAuditLogRepo);
        const result = await useCase.execute({
            adminId: adminId.toHexString(),
            action: "BAN_USER",
            targetEntity: "User",
            page: 2,
            limit: 10,
        });

        expect(result.data.length).toBe(1);
        expect(result.pagination).toEqual({
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
        });
    });

    it("should handle non-objectid adminId filter without error", async () => {
        const mockAuditLogRepo: IAuditLogRepository = {
            create: mock(async () => {}),
            findAll: mock(async (filter) => {
                expect(filter.adminId).toBeUndefined();
                return { logs: [], total: 0 };
            }),
        };

        const useCase = new ListAuditLogs(mockAuditLogRepo);
        const result = await useCase.execute({ adminId: "invalid-id" });

        expect(result.data.length).toBe(0);
        expect(result.pagination.total).toBe(0);
    });
});
