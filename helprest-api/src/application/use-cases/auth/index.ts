import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { generateTokens, verifyRefreshToken } from "@infra/security/jwt";
import type { TokenPair } from "@infra/security/jwt";
import { UnauthorizedError } from "@shared/errors";

export { GoogleAuthUser } from "./GoogleAuthUser";

export class RefreshToken {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(refreshToken: string): Promise<TokenPair> {
        const userId = await verifyRefreshToken(refreshToken);

        const user = await this.userRepo.findById(new ObjectId(userId));
        if (!user) {
            throw new UnauthorizedError("User not found");
        }

        return generateTokens({ sub: user.id.toHexString(), email: user.email });
    }
}
