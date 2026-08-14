import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { NotFoundError, ValidationError } from "@shared/errors";

export interface BanUserInput {
    userId: string;
    isBanned: boolean;
    reason?: string;
}

export class BanUser {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(input: BanUserInput) {
        if (!ObjectId.isValid(input.userId)) {
            throw new ValidationError("Invalid user ID format");
        }

        const objectId = new ObjectId(input.userId);
        const user = await this.userRepo.findById(objectId);

        if (!user) {
            throw new NotFoundError("User not found");
        }

        const updatedUser = user.withBan(input.isBanned, input.reason);
        await this.userRepo.update(updatedUser);

        return {
            id: updatedUser.id.toHexString(),
            name: updatedUser.name,
            email: updatedUser.email,
            isBanned: updatedUser.isBanned,
            status: updatedUser.status,
            banReason: updatedUser.banReason,
            bannedAt: updatedUser.bannedAt ? updatedUser.bannedAt.toISOString() : null,
        };
    }
}
