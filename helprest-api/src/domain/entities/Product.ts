import { ObjectId } from "mongodb";

export interface ProductProps {
    id?: ObjectId;
    establishmentId: ObjectId;
    flags: ObjectId[];
    name: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    ingredients?: string[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Product {
    readonly id: ObjectId;
    readonly establishmentId: ObjectId;
    readonly flags: ReadonlyArray<ObjectId>;
    readonly name: string;
    readonly description: string;
    readonly price: number;
    readonly imageUrl: string | null;
    readonly ingredients: ReadonlyArray<string>;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: ProductProps) {
        this.id = props.id ?? new ObjectId();
        this.establishmentId = props.establishmentId;
        this.flags = Object.freeze([...props.flags]);
        this.name = props.name;
        this.description = props.description;
        this.price = props.price;
        this.imageUrl = props.imageUrl ?? null;
        this.ingredients = Object.freeze([...(props.ingredients || [])]);
        this.isActive = props.isActive ?? true;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: ProductProps): Product {
        if (!props.name || props.name.trim() === "") {
            throw new Error("Product requires a name");
        }
        if (props.description && props.description.length > 500) {
            throw new Error("Product description cannot exceed 500 characters");
        }
        if (props.price < 0) {
            throw new Error("Product price cannot be negative");
        }
        if (props.ingredients && props.ingredients.some(ing => ing.length > 150)) {
            throw new Error("Single ingredient cannot exceed 150 characters");
        }
        if (props.ingredients && props.ingredients.length > 30) {
            throw new Error("Product cannot have more than 30 ingredients");
        }
        return new Product(props);
    }

    static fromDocument(doc: Record<string, unknown>): Product {
        return new Product({
            id: doc._id as ObjectId,
            establishmentId: doc.establishmentId as ObjectId,
            flags: (doc.flags as ObjectId[]) ?? [],
            name: doc.name as string,
            description: doc.description as string,
            price: doc.price as number,
            imageUrl: doc.imageUrl as string | null,
            ingredients: (doc.ingredients as string[]) ?? [],
            isActive: doc.isActive as boolean,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            establishmentId: this.establishmentId,
            flags: [...this.flags],
            name: this.name,
            description: this.description,
            price: this.price,
            imageUrl: this.imageUrl,
            ingredients: [...this.ingredients],
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private toProps(): ProductProps {
        return {
            id: this.id,
            establishmentId: this.establishmentId,
            flags: [...this.flags],
            name: this.name,
            description: this.description,
            price: this.price,
            imageUrl: this.imageUrl,
            ingredients: [...this.ingredients],
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
