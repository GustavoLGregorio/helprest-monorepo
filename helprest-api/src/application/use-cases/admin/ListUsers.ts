import type { IUserRepository } from "@domain/repositories/IUserRepository";

export interface ListUsersInput {
    query?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export class ListUsers {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(input: ListUsersInput = {}) {
        const page = input.page ?? 1;
        const limit = input.limit ?? 20;
        const skip = (page - 1) * limit;

        const { users, total } = await this.userRepo.findAll({
            query: input.query,
            role: input.role,
            status: input.status,
            limit,
            skip,
        });

        return {
            data: users.map((u) => ({
                id: u.id.toHexString(),
                name: u.name,
                email: u.email,
                role: u.role.value,
                status: u.status,
                isBanned: u.isBanned,
                banReason: u.banReason,
                bannedAt: u.bannedAt ? u.bannedAt.toISOString() : null,
                profilePhoto: u.profilePhoto || null,
                createdAt: u.createdAt.toISOString(),
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
