import { ObjectId } from "mongodb";
import { Location } from "../value-objects/Location";
import { SocialLinks } from "../value-objects/SocialLinks";
import type { LocationProps } from "../value-objects/Location";
import type { SocialLinksProps } from "../value-objects/SocialLinks";

export interface UserProps {
    id?: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    birthDate: Date;
    flags: ObjectId[];
    location?: Location;
    socialLinksEnabled: boolean;
    socialLinks?: SocialLinks;
    profilePhoto?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User {
    readonly id: ObjectId;
    readonly name: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly birthDate: Date;
    readonly flags: ReadonlyArray<ObjectId>;
    readonly location?: Location;
    readonly socialLinksEnabled: boolean;
    readonly socialLinks?: SocialLinks;
    readonly profilePhoto?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: UserProps) {
        this.id = props.id ?? new ObjectId();
        this.name = props.name;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.birthDate = props.birthDate;
        this.flags = Object.freeze([...props.flags]);
        this.location = props.location;
        this.socialLinksEnabled = props.socialLinksEnabled;
        this.socialLinks = props.socialLinks;
        this.profilePhoto = props.profilePhoto;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: UserProps): User {
        if (!props.name || !props.email || !props.passwordHash) {
            throw new Error("User requires name, email, and passwordHash");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(props.email)) {
            throw new Error("Invalid email format");
        }

        return new User(props);
    }

    static fromDocument(doc: Record<string, unknown>): User {
        const locationDoc = doc.location as Record<string, unknown> | undefined;
        const socialLinksDoc = doc.socialLinks as Record<string, unknown> | undefined;

        return new User({
            id: doc._id as ObjectId,
            name: doc.name as string,
            email: doc.email as string,
            passwordHash: doc.passwordHash as string,
            birthDate: new Date(doc.birthDate as string | number | Date),
            flags: (doc.flags as ObjectId[]) ?? [],
            location: locationDoc
                ? Location.create(locationDoc as unknown as LocationProps)
                : undefined,
            socialLinksEnabled: (doc.socialLinksEnabled as boolean) ?? false,
            socialLinks: socialLinksDoc
                ? SocialLinks.create(socialLinksDoc as unknown as SocialLinksProps)
                : undefined,
            profilePhoto: doc.profilePhoto as string | undefined,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            name: this.name,
            email: this.email,
            passwordHash: this.passwordHash,
            birthDate: this.birthDate,
            flags: [...this.flags],
            location: this.location
                ? {
                    state: this.location.state,
                    city: this.location.city,
                    neighborhood: this.location.neighborhood,
                    address: this.location.address,
                    coordinates: this.location.toGeoJSON(),
                }
                : undefined,
            socialLinksEnabled: this.socialLinksEnabled,
            socialLinks: this.socialLinks
                ? {
                    instagram: this.socialLinks.instagram,
                    facebook: this.socialLinks.facebook,
                    twitter: this.socialLinks.twitter,
                    tiktok: this.socialLinks.tiktok,
                    website: this.socialLinks.website,
                }
                : undefined,
            profilePhoto: this.profilePhoto,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
