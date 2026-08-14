import { ObjectId } from "mongodb";

export interface VisitReport {
    userId: ObjectId;
    reason: string;
    createdAt: Date;
}

export interface VisitProps {
    id?: ObjectId;
    establishmentId: ObjectId;
    userId: ObjectId;
    date: Date;
    review: string;
    rating: number;
    photoUrls?: string[];
    createdAt?: Date;
    isModerated?: boolean;
    moderationReason?: string | null;
    isReported?: boolean;
    reportCount?: number;
    reports?: VisitReport[];
}

export class Visit {
    readonly id: ObjectId;
    readonly establishmentId: ObjectId;
    readonly userId: ObjectId;
    readonly date: Date;
    readonly review: string;
    readonly rating: number;
    readonly photoUrls: ReadonlyArray<string>;
    readonly createdAt: Date;
    readonly isModerated: boolean;
    readonly moderationReason: string | null;
    readonly isReported: boolean;
    readonly reportCount: number;
    readonly reports: ReadonlyArray<VisitReport>;

    private constructor(props: VisitProps) {
        this.id = props.id ?? new ObjectId();
        this.establishmentId = props.establishmentId;
        this.userId = props.userId;
        this.date = props.date;
        this.review = props.review;
        this.rating = props.rating;
        this.photoUrls = Object.freeze([...(props.photoUrls || [])]);
        this.createdAt = props.createdAt ?? new Date();
        this.isModerated = props.isModerated ?? false;
        this.moderationReason = props.moderationReason ?? null;
        this.isReported = props.isReported ?? false;
        this.reportCount = props.reportCount ?? 0;
        this.reports = Object.freeze([...(props.reports || [])]);
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
        const rawReports = (doc.reports as Array<Record<string, unknown>>) || [];
        return new Visit({
            id: doc._id as ObjectId,
            establishmentId: doc.establishmentId as ObjectId,
            userId: doc.userId as ObjectId,
            date: new Date(doc.date as string | number | Date),
            review: doc.review as string,
            rating: doc.rating as number,
            photoUrls: (doc.photoUrls as string[]) ?? [],
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
            isModerated: (doc.isModerated as boolean) ?? false,
            moderationReason: (doc.moderationReason as string) ?? null,
            isReported: (doc.isReported as boolean) ?? false,
            reportCount: (doc.reportCount as number) ?? 0,
            reports: rawReports.map((r) => ({
                userId: r.userId as ObjectId,
                reason: r.reason as string,
                createdAt: new Date(r.createdAt as string | number | Date),
            })),
        });
    }

    moderate(isModerated: boolean, reason?: string): Visit {
        return new Visit({
            id: this.id,
            establishmentId: this.establishmentId,
            userId: this.userId,
            date: this.date,
            review: this.review,
            rating: this.rating,
            photoUrls: [...this.photoUrls],
            createdAt: this.createdAt,
            isModerated,
            moderationReason: isModerated ? (reason ?? "Moderado por administrador") : null,
            isReported: this.isReported,
            reportCount: this.reportCount,
            reports: [...this.reports],
        });
    }

    addReport(userId: ObjectId, reason: string): Visit {
        const newReport: VisitReport = {
            userId,
            reason,
            createdAt: new Date(),
        };
        return new Visit({
            id: this.id,
            establishmentId: this.establishmentId,
            userId: this.userId,
            date: this.date,
            review: this.review,
            rating: this.rating,
            photoUrls: [...this.photoUrls],
            createdAt: this.createdAt,
            isModerated: this.isModerated,
            moderationReason: this.moderationReason,
            isReported: true,
            reportCount: this.reportCount + 1,
            reports: [...this.reports, newReport],
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
            photoUrls: [...this.photoUrls],
            createdAt: this.createdAt,
            isModerated: this.isModerated,
            moderationReason: this.moderationReason,
            isReported: this.isReported,
            reportCount: this.reportCount,
            reports: this.reports.map((r) => ({
                userId: r.userId,
                reason: r.reason,
                createdAt: r.createdAt,
            })),
        };
    }
}
