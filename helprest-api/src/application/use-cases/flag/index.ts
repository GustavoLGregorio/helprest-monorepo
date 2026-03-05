import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import { Flag } from "@domain/entities/Flag";

export class ListFlags {
    constructor(private readonly flagRepo: IFlagRepository) { }

    async execute() {
        const flags = await this.flagRepo.findAll();
        return flags.map((f) => ({
            id: f.id.toHexString(),
            type: f.type,
            identifier: f.identifier,
            description: f.description,
            tag: f.tag,
            backgroundColor: f.backgroundColor,
            textColor: f.textColor,
        }));
    }
}

export class CreateFlag {
    constructor(private readonly flagRepo: IFlagRepository) { }

    async execute(input: {
        type: string;
        identifier: string;
        description: string;
        tag: string;
        backgroundColor: string;
        textColor: string;
    }) {
        const flag = Flag.create(input);
        await this.flagRepo.create(flag);
        return { id: flag.id.toHexString() };
    }
}
