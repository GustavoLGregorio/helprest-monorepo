import { ObjectId } from "mongodb";
import { Location } from "../value-objects/Location";
import { SocialLinks } from "../value-objects/SocialLinks";
import { Role } from "../value-objects/Role";
import type { RoleType } from "../value-objects/Role";
import type { LocationProps } from "../value-objects/Location";
import type { SocialLinksProps } from "../value-objects/SocialLinks";

export type AuthProvider = "google" | "apple";

export interface UserProps {
    id?: ObjectId;
    name: string;
    email: string;
    authProvider: AuthProvider;
    googleId?: string;
    birthDate?: Date;
    flags: ObjectId[];
    location?: Location;
    socialLinksEnabled: boolean;
    socialLinks?: SocialLinks;
    profilePhoto?: string;
    role?: Role | RoleType | string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User {
    readonly id: ObjectId;
    readonly name: string;
    readonly email: string;
    readonly authProvider: AuthProvider;
    readonly googleId?: string;
    readonly birthDate?: Date;
    readonly flags: ReadonlyArray<ObjectId>;
    readonly location?: Location;
    readonly socialLinksEnabled: boolean;
    readonly socialLinks?: SocialLinks;
    readonly profilePhoto?: string;
    readonly role: Role;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: Omit<UserProps, "role"> & { role: Role }) {
        this.id = props.id ?? new ObjectId();
        this.name = props.name;
        this.email = props.email;
        this.authProvider = props.authProvider;
        this.googleId = props.googleId;
        this.birthDate = props.birthDate;
        this.flags = Object.freeze([...props.flags]);
        this.location = props.location;
        this.socialLinksEnabled = props.socialLinksEnabled;
        this.socialLinks = props.socialLinks;
        this.profilePhoto = props.profilePhoto;
        this.role = props.role;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: UserProps): User {
        if (!props.name || !props.email) {
            throw new Error("User requires name and email");
        }

        if (props.authProvider === "google" && !props.googleId) {
            throw new Error("Google auth users require a googleId");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(props.email)) {
            throw new Error("Invalid email format");
        }

        const roleInstance = props.role instanceof Role 
            ? props.role 
            : Role.create(props.role);

        return new User({
            ...props,
            role: roleInstance,
        });
    }

    static fromDocument(doc: Record<string, unknown>): User {
        const locationDoc = doc.location as Record<string, unknown> | undefined;
        const socialLinksDoc = doc.socialLinks as Record<string, unknown> | undefined;

        return User.create({
            id: doc._id as ObjectId,
            name: doc.name as string,
            email: doc.email as string,
            authProvider: (doc.authProvider as AuthProvider) ?? "google",
            googleId: doc.googleId as string | undefined,
            birthDate: doc.birthDate
                ? new Date(doc.birthDate as string | number | Date)
                : undefined,
            flags: (doc.flags as ObjectId[]) ?? [],
            location: locationDoc
                ? Location.create(locationDoc as unknown as LocationProps)
                : undefined,
            socialLinksEnabled: (doc.socialLinksEnabled as boolean) ?? false,
            socialLinks: socialLinksDoc
                ? SocialLinks.create(socialLinksDoc as unknown as SocialLinksProps)
                : undefined,
            profilePhoto: doc.profilePhoto as string | undefined,
            role: doc.role as string | undefined,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            name: this.name,
            email: this.email,
            authProvider: this.authProvider,
            googleId: this.googleId,
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
            role: this.role.value,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
