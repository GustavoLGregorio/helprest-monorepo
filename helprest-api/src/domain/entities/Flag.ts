import { ObjectId } from "mongodb";

export interface FlagImages {
    tag: string | null;
    pin: string | null;
}

export interface FlagProps {
    id?: ObjectId;
    type: string;
    identifier: string;
    description: string;
    tag: string;
    backgroundColor: string;
    textColor: string;
    images?: FlagImages;
}

export class Flag {
    readonly id: ObjectId;
    readonly type: string;
    readonly identifier: string;
    readonly description: string;
    readonly tag: string;
    readonly backgroundColor: string;
    readonly textColor: string;
    readonly images: FlagImages;

    private constructor(props: FlagProps) {
        this.id = props.id ?? new ObjectId();
        this.type = props.type;
        this.identifier = props.identifier;
        this.description = props.description;
        this.tag = props.tag;
        this.backgroundColor = props.backgroundColor;
        this.textColor = props.textColor;
        this.images = props.images ?? { tag: null, pin: null };
    }

    static create(props: FlagProps): Flag {
        if (!props.type || !props.identifier || !props.tag) {
            throw new Error("Flag requires type, identifier, and tag");
        }
        return new Flag(props);
    }

    static fromDocument(doc: Record<string, unknown>): Flag {
        const rawImages = doc.images as Record<string, unknown> | undefined;
        return new Flag({
            id: doc._id as ObjectId,
            type: doc.type as string,
            identifier: doc.identifier as string,
            description: doc.description as string,
            tag: doc.tag as string,
            backgroundColor: (doc.backgroundColor as string) ?? "#888888",
            textColor: (doc.textColor as string) ?? "#FFFFFF",
            images: rawImages
                ? {
                    tag: (rawImages.tag as string) ?? null,
                    pin: (rawImages.pin as string) ?? null,
                }
                : { tag: null, pin: null },
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            type: this.type,
            identifier: this.identifier,
            description: this.description,
            tag: this.tag,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            images: this.images,
        };
    }
}
