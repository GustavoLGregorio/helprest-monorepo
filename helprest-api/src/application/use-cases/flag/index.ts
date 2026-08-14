import { ObjectId } from "mongodb";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import { Flag, type FlagImages } from "@domain/entities/Flag";
import { NotFoundError, ValidationError } from "@shared/errors";

export class ListFlags {
    constructor(private readonly flagRepo: IFlagRepository) {}

    async execute(includeInactive = false) {
        const flags = await this.flagRepo.findAll(includeInactive);
        return flags.map((f) => ({
            id: f.id.toHexString(),
            type: f.type,
            identifier: f.identifier,
            description: f.description,
            tag: f.tag,
            backgroundColor: f.backgroundColor,
            textColor: f.textColor,
            images: f.images,
            isActive: f.isActive,
            order: f.order,
        }));
    }
}

export interface CreateFlagInput {
    type: string;
    identifier: string;
    description: string;
    tag: string;
    backgroundColor: string;
    textColor: string;
    images?: FlagImages;
    isActive?: boolean;
    order?: number;
}

export class CreateFlag {
    constructor(private readonly flagRepo: IFlagRepository) {}

    async execute(input: CreateFlagInput) {
        const flag = Flag.create(input);
        await this.flagRepo.create(flag);
        return {
            id: flag.id.toHexString(),
            type: flag.type,
            identifier: flag.identifier,
            description: flag.description,
            tag: flag.tag,
            backgroundColor: flag.backgroundColor,
            textColor: flag.textColor,
            images: flag.images,
            isActive: flag.isActive,
            order: flag.order,
        };
    }
}

export interface UpdateFlagInput {
    type?: string;
    identifier?: string;
    description?: string;
    tag?: string;
    backgroundColor?: string;
    textColor?: string;
    images?: FlagImages;
    isActive?: boolean;
    order?: number;
}

export class UpdateFlag {
    constructor(private readonly flagRepo: IFlagRepository) {}

    async execute(id: string, input: UpdateFlagInput) {
        if (!ObjectId.isValid(id)) {
            throw new ValidationError("Invalid flag ID format");
        }

        const objectId = new ObjectId(id);
        const existingFlag = await this.flagRepo.findById(objectId);

        if (!existingFlag) {
            throw new NotFoundError("Flag not found");
        }

        const updatedFlag = existingFlag.withUpdatedProps(input);
        await this.flagRepo.update(updatedFlag);

        return {
            id: updatedFlag.id.toHexString(),
            type: updatedFlag.type,
            identifier: updatedFlag.identifier,
            description: updatedFlag.description,
            tag: updatedFlag.tag,
            backgroundColor: updatedFlag.backgroundColor,
            textColor: updatedFlag.textColor,
            images: updatedFlag.images,
            isActive: updatedFlag.isActive,
            order: updatedFlag.order,
        };
    }
}

export class DeleteFlag {
    constructor(private readonly flagRepo: IFlagRepository) {}

    async execute(id: string) {
        if (!ObjectId.isValid(id)) {
            throw new ValidationError("Invalid flag ID format");
        }

        const objectId = new ObjectId(id);
        const existingFlag = await this.flagRepo.findById(objectId);

        if (!existingFlag) {
            throw new NotFoundError("Flag not found");
        }

        await this.flagRepo.delete(objectId);
        return { success: true };
    }
}

export class ReorderFlags {
    constructor(private readonly flagRepo: IFlagRepository) {}

    async execute(orders: Array<{ id: string; order: number }>) {
        await Promise.all(
            orders.map(async (item) => {
                if (ObjectId.isValid(item.id)) {
                    await this.flagRepo.updateOrder(new ObjectId(item.id), item.order);
                }
            })
        );
        return { success: true };
    }
}
