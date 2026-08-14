import { describe, expect, it, mock } from "bun:test";
import { GetAdminDashboardMetrics } from "../../../../../src/application/use-cases/admin/GetAdminDashboardMetrics";
import type { IUserRepository } from "../../../../../src/domain/repositories/IUserRepository";
import type { IEstablishmentRepository } from "../../../../../src/domain/repositories/IEstablishmentRepository";
import type { IVisitRepository } from "../../../../../src/domain/repositories/IVisitRepository";
import type { IFlagRepository } from "../../../../../src/domain/repositories/IFlagRepository";
import { Flag } from "../../../../../src/domain/entities/Flag";
import { Establishment } from "../../../../../src/domain/entities/Establishment";
import { Location } from "../../../../../src/domain/value-objects/Location";
import { ObjectId } from "mongodb";

describe("GetAdminDashboardMetrics Use Case Unit Tests", () => {
    const flagId = new ObjectId();
    const mockFlag = Flag.create({
        id: flagId,
        type: "dietary",
        identifier: "vegan",
        description: "Vegano",
        tag: "Vegano",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
    });

    const estId = new ObjectId();
    const mockEstablishment = Establishment.create({
        id: estId,
        companyName: "Restaurante Verde",
        location: Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Centro",
            address: "Rua XV, 100",
            coordinates: { lat: -25.4284, lng: -49.2733 },
        }),
        flags: [flagId],
        logo: "https://example.com/logo.png",
        rating: 4.9,
        ratingCount: 20,
        ratingTotal: 98,
    });

    const mockUserRepo: IUserRepository = {
        findById: mock(async () => null),
        findByEmail: mock(async () => null),
        findByGoogleId: mock(async () => null),
        findAll: mock(async () => ({ users: [], total: 0 })),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 150),
        getFlagDistribution: mock(async () => [{ flagId, count: 42 }]),
    };

    const mockEstRepo: IEstablishmentRepository = {
        findById: mock(async () => null),
        findByAdminId: mock(async () => null),
        findAll: mock(async () => []),
        findManyByIds: mock(async () => []),
        findNearby: mock(async () => []),
        findByFlags: mock(async () => []),
        search: mock(async () => []),
        findSponsored: mock(async () => []),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 18),
        findTopRated: mock(async () => [mockEstablishment]),
    };

    const mockVisitRepo: IVisitRepository = {
        findById: mock(async () => null),
        findByUserId: mock(async () => []),
        findByEstablishmentId: mock(async () => []),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        countByEstablishment: mock(async () => 0),
        count: mock(async () => 340),
        findRecentWithPhotos: mock(async () => []),
        findReported: mock(async () => []),
        moderate: mock(async () => {}),
        addReport: mock(async () => {}),
    };

    const mockFlagRepo: IFlagRepository = {
        findById: mock(async () => mockFlag),
        findAll: mock(async () => [mockFlag]),
        findByIds: mock(async () => [mockFlag]),
        findByType: mock(async () => [mockFlag]),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        updateOrder: mock(async () => {}),
    };

    it("should return aggregated counts, flag distribution and top rated establishments", async () => {
        const useCase = new GetAdminDashboardMetrics(
            mockUserRepo,
            mockEstRepo,
            mockVisitRepo,
            mockFlagRepo
        );

        const result = await useCase.execute();

        expect(result.overview.totalUsers).toBe(150);
        expect(result.overview.totalEstablishments).toBe(18);
        expect(result.overview.totalVisits).toBe(340);

        expect(result.flagDistribution.length).toBe(1);
        expect(result.flagDistribution[0]!.flagId).toBe(flagId.toHexString());
        expect(result.flagDistribution[0]!.tag).toBe("Vegano");
        expect(result.flagDistribution[0]!.count).toBe(42);

        expect(result.topRatedEstablishments.length).toBe(1);
        expect(result.topRatedEstablishments[0]!.companyName).toBe("Restaurante Verde");
        expect(result.topRatedEstablishments[0]!.rating).toBe(4.9);
    });
});
