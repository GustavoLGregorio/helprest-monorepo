import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { hashPassword, verifyPassword } from "@infra/security/password";
import { generateTokens, verifyRefreshToken } from "@infra/security/jwt";
import type { TokenPair } from "@infra/security/jwt";
import { ConflictError, UnauthorizedError, ValidationError } from "@shared/errors";
import type { RegisterInput, LoginInput } from "@interface/validation/auth.schema";

export class RegisterUser {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(input: RegisterInput): Promise<TokenPair> {
        const existing = await this.userRepo.findByEmail(input.email);
        if (existing) {
            throw new ConflictError("Email already registered");
        }

        const passwordHash = await hashPassword(input.password);
        const flagIds = input.flagIds.map((id) => new ObjectId(id));

        const user = User.create({
            name: input.name,
            email: input.email,
            passwordHash,
            birthDate: new Date(input.birthDate),
            flags: flagIds,
            socialLinksEnabled: false,
        });

        await this.userRepo.create(user);

        return generateTokens({ sub: user.id.toHexString(), email: user.email });
    }
}

export class LoginUser {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(input: LoginInput): Promise<TokenPair> {
        const user = await this.userRepo.findByEmail(input.email);
        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const isValid = await verifyPassword(user.passwordHash, input.password);
        if (!isValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        return generateTokens({ sub: user.id.toHexString(), email: user.email });
    }
}

export class RefreshToken {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(refreshToken: string): Promise<TokenPair> {
        const userId = await verifyRefreshToken(refreshToken);

        const user = await this.userRepo.findById(new ObjectId(userId));
        if (!user) {
            throw new UnauthorizedError("User not found");
        }

        return generateTokens({ sub: user.id.toHexString(), email: user.email });
    }
}
