import { ObjectId } from "mongodb";
import { Location } from "../value-objects/Location";
import type { LocationProps } from "../value-objects/Location";

export interface EstablishmentProps {
    id?: ObjectId;
    companyName: string;
    location: Location;
    flags: ObjectId[];
    logo: string;
    rating: number;
    ratingCount: number;
    ratingTotal: number;
    isSponsored?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Establishment {
    readonly id: ObjectId;
    readonly companyName: string;
    readonly location: Location;
    readonly flags: ReadonlyArray<ObjectId>;
    readonly logo: string;
    readonly rating: number;
    readonly ratingCount: number;
    readonly ratingTotal: number;
    readonly isSponsored: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: EstablishmentProps) {
        this.id = props.id ?? new ObjectId();
        this.companyName = props.companyName;
        this.location = props.location;
        this.flags = Object.freeze([...props.flags]);
        this.logo = props.logo;
        this.rating = props.rating;
        this.ratingCount = props.ratingCount;
        this.ratingTotal = props.ratingTotal;
        this.isSponsored = props.isSponsored ?? false;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: EstablishmentProps): Establishment {
        if (!props.companyName) {
            throw new Error("Establishment requires a company name");
        }
        return new Establishment(props);
    }

    static fromDocument(doc: Record<string, unknown>): Establishment {
        const locationDoc = doc.location as Record<string, unknown>;

        // Handle GeoJSON coordinates → LocationProps
        const geoCoords = locationDoc.coordinates as { type: string; coordinates: number[] } | undefined;
        const locationProps: LocationProps = {
            state: locationDoc.state as string,
            city: locationDoc.city as string,
            neighborhood: locationDoc.neighborhood as string,
            address: locationDoc.address as string,
            coordinates: geoCoords
                ? { lng: geoCoords.coordinates[0]!, lat: geoCoords.coordinates[1]! }
                : { lat: 0, lng: 0 },
        };

        return new Establishment({
            id: doc._id as ObjectId,
            companyName: doc.companyName as string,
            location: Location.create(locationProps),
            flags: (doc.flags as ObjectId[]) ?? [],
            logo: doc.logo as string,
            rating: (doc.rating as number) ?? 0,
            ratingCount: (doc.ratingCount as number) ?? 0,
            ratingTotal: (doc.ratingTotal as number) ?? 0,
            isSponsored: (doc.isSponsored as boolean) ?? false,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            companyName: this.companyName,
            location: {
                state: this.location.state,
                city: this.location.city,
                neighborhood: this.location.neighborhood,
                address: this.location.address,
                coordinates: this.location.toGeoJSON(),
            },
            flags: [...this.flags],
            logo: this.logo,
            rating: this.rating,
            ratingCount: this.ratingCount,
            ratingTotal: this.ratingTotal,
            isSponsored: this.isSponsored,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Returns a new Establishment with recalculated rating after a new visit.
     */
    withNewRating(visitRating: number): Establishment {
        const newCount = this.ratingCount + 1;
        const newTotal = this.ratingTotal + visitRating;
        const newAverage = Math.round((newTotal / newCount) * 10) / 10;

        return new Establishment({
            ...this.toProps(),
            rating: newAverage,
            ratingCount: newCount,
            ratingTotal: newTotal,
            updatedAt: new Date(),
        });
    }

    private toProps(): EstablishmentProps {
        return {
            id: this.id,
            companyName: this.companyName,
            location: this.location,
            flags: [...this.flags],
            logo: this.logo,
            rating: this.rating,
            ratingCount: this.ratingCount,
            ratingTotal: this.ratingTotal,
            isSponsored: this.isSponsored,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
