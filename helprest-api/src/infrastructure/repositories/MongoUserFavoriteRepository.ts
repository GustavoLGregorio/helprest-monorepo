import { ObjectId } from "mongodb";
import { UserFavorite, FavoriteType } from "../../domain/entities/UserFavorite";
import { IUserFavoriteRepository } from "../../domain/repositories/IUserFavoriteRepository";
import { getUserFavoritesCollection } from "../database/mongodb/collections";

export class MongoUserFavoriteRepository implements IUserFavoriteRepository {
    async add(favorite: UserFavorite): Promise<void> {
        try {
            await getUserFavoritesCollection().insertOne(favorite.toDocument());
        } catch (error: any) {
            // Se já existir, ignoramos
            if (error.code === 11000) return;
            throw error;
        }
    }

    async remove(userId: ObjectId, referenceId: ObjectId): Promise<void> {
        await getUserFavoritesCollection().deleteOne({ userId, referenceId });
    }

    async findByUserAndType(userId: ObjectId, type: FavoriteType): Promise<UserFavorite[]> {
        const docs = await getUserFavoritesCollection().find({ userId, type }).toArray();
        return docs.map((doc) => UserFavorite.fromDocument(doc));
    }

    async findByUser(userId: ObjectId): Promise<UserFavorite[]> {
        const docs = await getUserFavoritesCollection().find({ userId }).toArray();
        return docs.map((doc) => UserFavorite.fromDocument(doc));
    }

    async exists(userId: ObjectId, referenceId: ObjectId): Promise<boolean> {
        const count = await getUserFavoritesCollection().countDocuments({ userId, referenceId }, { limit: 1 });
        return count > 0;
    }
}
