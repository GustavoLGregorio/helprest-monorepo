import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import { User } from "@domain/entities/User";
import { Location } from "@domain/value-objects/Location";
import { SocialLinks } from "@domain/value-objects/SocialLinks";
import { NotFoundError } from "@shared/errors";
import type { UpdateProfileInput, UpdateFlagsInput } from "@interface/validation/user.schema";

export class GetUserProfile {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(userId: string) {
        const user = await this.userRepo.findById(new ObjectId(userId));
        if (!user) {
            throw new NotFoundError("User", userId);
        }

        // Return without passwordHash
        return {
            id: user.id.toHexString(),
            name: user.name,
            email: user.email,
            birthDate: user.birthDate,
            flags: user.flags.map((f) => f.toHexString()),
            location: user.location
                ? {
                    state: user.location.state,
                    city: user.location.city,
                    neighborhood: user.location.neighborhood,
                    address: user.location.address,
                    coordinates: user.location.coordinates,
                }
                : null,
            socialLinksEnabled: user.socialLinksEnabled,
            socialLinks: user.socialLinks ?? null,
            profilePhoto: user.profilePhoto ?? null,
        };
    }
}

export class UpdateUserProfile {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(userId: string, input: UpdateProfileInput) {
        const existing = await this.userRepo.findById(new ObjectId(userId));
        if (!existing) {
            throw new NotFoundError("User", userId);
        }

        const updatedUser = User.create({
            id: existing.id,
            name: input.name ?? existing.name,
            email: existing.email,
            passwordHash: existing.passwordHash,
            birthDate: existing.birthDate,
            flags: [...existing.flags],
            location: input.location
                ? Location.create(input.location)
                : existing.location,
            socialLinksEnabled: input.socialLinksEnabled ?? existing.socialLinksEnabled,
            socialLinks: input.socialLinks
                ? SocialLinks.create(input.socialLinks)
                : existing.socialLinks,
            profilePhoto: input.profilePhoto ?? existing.profilePhoto,
            createdAt: existing.createdAt,
        });

        await this.userRepo.update(updatedUser);
        return { success: true };
    }
}

export class UpdateUserFlags {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly flagRepo: IFlagRepository,
    ) { }

    async execute(userId: string, input: UpdateFlagsInput) {
        const user = await this.userRepo.findById(new ObjectId(userId));
        if (!user) {
            throw new NotFoundError("User", userId);
        }

        const flagObjectIds = input.flagIds.map((id) => new ObjectId(id));

        // Validate that all flags exist
        const existingFlags = await this.flagRepo.findByIds(flagObjectIds);
        if (existingFlags.length !== flagObjectIds.length) {
            throw new NotFoundError("One or more flags");
        }

        const updatedUser = User.create({
            id: user.id,
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash,
            birthDate: user.birthDate,
            flags: flagObjectIds,
            location: user.location,
            socialLinksEnabled: user.socialLinksEnabled,
            socialLinks: user.socialLinks,
            profilePhoto: user.profilePhoto,
            createdAt: user.createdAt,
        });

        await this.userRepo.update(updatedUser);
        return { success: true };
    }
}
