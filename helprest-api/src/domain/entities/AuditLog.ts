import { ObjectId } from "mongodb";

export interface AuditLogProps {
    id?: ObjectId;
    adminId: ObjectId;
    adminEmail: string;
    action: string;
    targetEntity: string;
    targetId: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    createdAt?: Date;
}

export class AuditLog {
    readonly id: ObjectId;
    readonly adminId: ObjectId;
    readonly adminEmail: string;
    readonly action: string;
    readonly targetEntity: string;
    readonly targetId: string;
    readonly details: Record<string, unknown>;
    readonly ipAddress?: string;
    readonly createdAt: Date;

    private constructor(props: AuditLogProps) {
        this.id = props.id ?? new ObjectId();
        this.adminId = props.adminId;
        this.adminEmail = props.adminEmail;
        this.action = props.action;
        this.targetEntity = props.targetEntity;
        this.targetId = props.targetId;
        this.details = props.details ?? {};
        this.ipAddress = props.ipAddress;
        this.createdAt = props.createdAt ?? new Date();
    }

    static create(props: AuditLogProps): AuditLog {
        if (!props.adminId || !props.action || !props.targetEntity || !props.targetId) {
            throw new Error("AuditLog requires adminId, action, targetEntity, and targetId");
        }
        return new AuditLog(props);
    }

    static fromDocument(doc: Record<string, unknown>): AuditLog {
        return new AuditLog({
            id: doc._id as ObjectId,
            adminId: doc.adminId as ObjectId,
            adminEmail: doc.adminEmail as string,
            action: doc.action as string,
            targetEntity: doc.targetEntity as string,
            targetId: doc.targetId as string,
            details: (doc.details as Record<string, unknown>) ?? {},
            ipAddress: doc.ipAddress as string | undefined,
            createdAt: doc.createdAt ? new Date(doc.createdAt as string | number | Date) : undefined,
        });
    }

    toDocument(): Record<string, unknown> {
        return {
            _id: this.id,
            adminId: this.adminId,
            adminEmail: this.adminEmail,
            action: this.action,
            targetEntity: this.targetEntity,
            targetId: this.targetId,
            details: this.details,
            ipAddress: this.ipAddress,
            createdAt: this.createdAt,
        };
    }
}
