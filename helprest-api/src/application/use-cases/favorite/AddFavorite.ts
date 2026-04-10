import { ObjectId } from "mongodb";
import { UserFavorite, FavoriteType } from "../../../domain/entities/UserFavorite";
import { IUserFavoriteRepository } from "../../../domain/repositories/IUserFavoriteRepository";

export class AddFavorite {
    constructor(private favoriteRepo: IUserFavoriteRepository) {}

    async execute(userId: string, referenceId: string, type: FavoriteType): Promise<void> {
        const favorite = UserFavorite.create({
            userId: new ObjectId(userId),
            referenceId: new ObjectId(referenceId),
            type,
        });
        await this.favoriteRepo.add(favorite);
    }
}
