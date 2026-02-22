import { ObjectId } from "mongodb";

export interface FlagProps {
    id?: ObjectId;
    type: string;
    identifier: string;
    description: string;
    tag: string;
}

export class Flag {
    readonly id: ObjectId;
    readonly type: string;
    readonly identifier: string;
    readonly description: string;
    readonly tag: string;

    private constructor(props: FlagProps) {
        this.id = props.id ?? new ObjectId();
        this.type = props.type;
        this.identifier = props.identifier;
        this.description = props.description;
        this.tag = props.tag;
    }

    static create(props: FlagProps): Flag {
        if (!props.type || !props.identifier || !props.tag) {
            throw new Error("Flag requires type, identifier, and tag");
        }
        return new Flag(props);
    }

    static fromDocument(doc: Record<string, unknown>): Flag {
        return new Flag({
            id: doc._id as ObjectId,
            type: doc.type as string,
            identifier: doc.identifier as string,
            description: doc.description as string,
            tag: doc.tag as string,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            type: this.type,
            identifier: this.identifier,
            description: this.description,
            tag: this.tag,
        };
    }
}
