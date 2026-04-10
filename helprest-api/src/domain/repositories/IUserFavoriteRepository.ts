import { ObjectId } from "mongodb";
import { UserFavorite, FavoriteType } from "../entities/UserFavorite";

export interface IUserFavoriteRepository {
    add(favorite: UserFavorite): Promise<void>;
    remove(userId: ObjectId, referenceId: ObjectId): Promise<void>;
    findByUserAndType(userId: ObjectId, type: FavoriteType): Promise<UserFavorite[]>;
    findByUser(userId: ObjectId): Promise<UserFavorite[]>;
    exists(userId: ObjectId, referenceId: ObjectId): Promise<boolean>;
}
