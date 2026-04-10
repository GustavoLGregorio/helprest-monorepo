import { ObjectId } from "mongodb";

export type FavoriteType = "establishment" | "product";

export interface UserFavoriteProps {
    id?: ObjectId;
    userId: ObjectId;
    referenceId: ObjectId;
    type: FavoriteType;
    createdAt?: Date;
}

export class UserFavorite {
    readonly id: ObjectId;
    readonly userId: ObjectId;
    readonly referenceId: ObjectId;
    readonly type: FavoriteType;
    readonly createdAt: Date;

    private constructor(props: UserFavoriteProps) {
        this.id = props.id ?? new ObjectId();
        this.userId = props.userId;
        this.referenceId = props.referenceId;
        this.type = props.type;
        this.createdAt = props.createdAt ?? new Date();
    }

    static create(props: UserFavoriteProps): UserFavorite {
        return new UserFavorite(props);
    }

    static fromDocument(doc: Record<string, unknown>): UserFavorite {
        return new UserFavorite({
            id: doc._id as ObjectId,
            userId: doc.userId as ObjectId,
            referenceId: doc.referenceId as ObjectId,
            type: doc.type as FavoriteType,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            userId: this.userId,
            referenceId: this.referenceId,
            type: this.type,
            createdAt: this.createdAt,
        };
    }
}
