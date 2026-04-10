import { ObjectId } from "mongodb";
import { IUserFavoriteRepository } from "../../../domain/repositories/IUserFavoriteRepository";

export class RemoveFavorite {
    constructor(private favoriteRepo: IUserFavoriteRepository) {}

    async execute(userId: string, referenceId: string): Promise<void> {
        await this.favoriteRepo.remove(new ObjectId(userId), new ObjectId(referenceId));
    }
}
