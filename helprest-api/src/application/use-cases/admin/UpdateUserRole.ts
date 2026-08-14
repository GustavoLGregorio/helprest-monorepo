import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { Role, type RoleType } from "@domain/value-objects/Role";
import { NotFoundError, ValidationError } from "@shared/errors";

export interface UpdateUserRoleInput {
    userId: string;
    newRole: RoleType | string;
}

export class UpdateUserRole {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(input: UpdateUserRoleInput) {
        if (!ObjectId.isValid(input.userId)) {
            throw new ValidationError("Invalid user ID format");
        }

        const objectId = new ObjectId(input.userId);
        const user = await this.userRepo.findById(objectId);

        if (!user) {
            throw new NotFoundError("User not found");
        }

        const roleInstance = Role.create(input.newRole);
        const updatedUser = user.withRole(roleInstance);
        await this.userRepo.update(updatedUser);

        return {
            id: updatedUser.id.toHexString(),
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role.value,
        };
    }
}
