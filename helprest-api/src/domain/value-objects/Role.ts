export type RoleType = "user" | "establishment_admin" | "admin" | "superadmin";

export class Role {
    private static readonly HIERARCHY: Record<RoleType, number> = {
        user: 1,
        establishment_admin: 2,
        admin: 3,
        superadmin: 4,
    };

    private constructor(readonly value: RoleType) {}

    static create(input?: string | null): Role {
        if (!input) return new Role("user");
        const normalized = input.toLowerCase().trim();

        // Support legacy "establishment" role string by mapping to "establishment_admin"
        if (normalized === "establishment") {
            return new Role("establishment_admin");
        }

        if (normalized in Role.HIERARCHY) {
            return new Role(normalized as RoleType);
        }

        return new Role("user");
    }

    /**
     * Checks if this role has at least the permission level of the required role.
     */
    hasPermission(requiredRole: RoleType): boolean {
        return Role.HIERARCHY[this.value] >= Role.HIERARCHY[requiredRole];
    }

    isSuperAdmin(): boolean {
        return this.value === "superadmin";
    }

    isAdmin(): boolean {
        return this.hasPermission("admin");
    }

    isEstablishmentAdmin(): boolean {
        return this.hasPermission("establishment_admin");
    }

    equals(other: Role): boolean {
        return this.value === other.value;
    }
}
