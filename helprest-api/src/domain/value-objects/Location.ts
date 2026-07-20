import { ObjectId } from "mongodb";

export interface LocationProps {
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export class Location {
    readonly state: string;
    readonly city: string;
    readonly neighborhood: string;
    readonly address: string;
    readonly coordinates: { lat: number; lng: number };

    private constructor(props: LocationProps) {
        this.state = props.state;
        this.city = props.city;
        this.neighborhood = props.neighborhood;
        this.address = props.address;
        this.coordinates = Object.freeze({ ...(props.coordinates ?? { lat: 0, lng: 0 }) });
    }

    static create(props: LocationProps): Location {
        if (props.coordinates) {
            if (
                props.coordinates.lat < -90 ||
                props.coordinates.lat > 90 ||
                props.coordinates.lng < -180 ||
                props.coordinates.lng > 180
            ) {
                throw new Error("Invalid coordinates: lat must be [-90, 90], lng must be [-180, 180]");
            }
        }

        if (!props.address) {
            throw new Error("Location requires at least an address");
        }

        return new Location(props);
    }

    /**
     * Returns MongoDB GeoJSON format for 2dsphere index queries.
     * Returns null if coordinates are not set (lat=0, lng=0).
     */
    toGeoJSON(): { type: "Point"; coordinates: [number, number] } | null {
        if (this.coordinates.lat === 0 && this.coordinates.lng === 0) {
            return null;
        }
        return {
            type: "Point",
            coordinates: [this.coordinates.lng, this.coordinates.lat],
        };
    }

    equals(other: Location): boolean {
        return (
            this.coordinates.lat === other.coordinates.lat &&
            this.coordinates.lng === other.coordinates.lng
        );
    }
}
