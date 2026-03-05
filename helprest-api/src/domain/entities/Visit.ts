import { ObjectId } from "mongodb";

export interface VisitProps {
    id?: ObjectId;
    establishmentId: ObjectId;
    userId: ObjectId;
    date: Date;
    review: string;
    rating: number;
    createdAt?: Date;
}

export class Visit {
    readonly id: ObjectId;
    readonly establishmentId: ObjectId;
    readonly userId: ObjectId;
    readonly date: Date;
    readonly review: string;
    readonly rating: number;
    readonly createdAt: Date;

    private constructor(props: VisitProps) {
        this.id = props.id ?? new ObjectId();
        this.establishmentId = props.establishmentId;
        this.userId = props.userId;
        this.date = props.date;
        this.review = props.review;
        this.rating = props.rating;
        this.createdAt = props.createdAt ?? new Date();
    }

    static create(props: VisitProps): Visit {
        if (props.rating < 1 || props.rating > 5) {
            throw new Error("Visit rating must be between 1 and 5");
        }
        if (!props.review || props.review.trim().length === 0) {
            throw new Error("Visit requires a review text");
        }
        return new Visit(props);
    }

    static fromDocument(doc: Record<string, unknown>): Visit {
        return new Visit({
            id: doc._id as ObjectId,
            establishmentId: doc.establishmentId as ObjectId,
            userId: doc.userId as ObjectId,
            date: new Date(doc.date as string | number | Date),
            review: doc.review as string,
            rating: doc.rating as number,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            establishmentId: this.establishmentId,
            userId: this.userId,
            date: this.date,
            review: this.review,
            rating: this.rating,
            createdAt: this.createdAt,
        };
    }
}
