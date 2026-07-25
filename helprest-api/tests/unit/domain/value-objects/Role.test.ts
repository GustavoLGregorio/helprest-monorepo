import { describe, expect, it } from "bun:test";
import { Role } from "../../../../src/domain/value-objects/Role";

describe("Role Value Object", () => {
    it("should default to 'user' when created without input", () => {
        const role = Role.create();
        expect(role.value).toBe("user");
    });

    it("should normalize legacy 'establishment' string to 'establishment_admin'", () => {
        const role = Role.create("establishment");
        expect(role.value).toBe("establishment_admin");
        expect(role.isEstablishmentAdmin()).toBeTrue();
    });

    it("should support all hierarchical roles: user, establishment_admin, admin, superadmin", () => {
        expect(Role.create("user").value).toBe("user");
        expect(Role.create("establishment_admin").value).toBe("establishment_admin");
        expect(Role.create("admin").value).toBe("admin");
        expect(Role.create("superadmin").value).toBe("superadmin");
    });

    it("should evaluate hierarchy permissions correctly", () => {
        const superadmin = Role.create("superadmin");
        const admin = Role.create("admin");
        const estAdmin = Role.create("establishment_admin");
        const user = Role.create("user");

        // Superadmin has all permissions
        expect(superadmin.hasPermission("superadmin")).toBeTrue();
        expect(superadmin.hasPermission("admin")).toBeTrue();
        expect(superadmin.hasPermission("establishment_admin")).toBeTrue();
        expect(superadmin.hasPermission("user")).toBeTrue();

        // Admin has admin, estAdmin, and user permissions, but not superadmin
        expect(admin.hasPermission("superadmin")).toBeFalse();
        expect(admin.hasPermission("admin")).toBeTrue();
        expect(admin.hasPermission("establishment_admin")).toBeTrue();
        expect(admin.hasPermission("user")).toBeTrue();

        // Establishment Admin
        expect(estAdmin.hasPermission("admin")).toBeFalse();
        expect(estAdmin.hasPermission("establishment_admin")).toBeTrue();
        expect(estAdmin.hasPermission("user")).toBeTrue();

        // User
        expect(user.hasPermission("establishment_admin")).toBeFalse();
        expect(user.hasPermission("user")).toBeTrue();
    });

    it("should check equality between Role instances", () => {
        const role1 = Role.create("admin");
        const role2 = Role.create("ADMIN");
        const role3 = Role.create("user");

        expect(role1.equals(role2)).toBeTrue();
        expect(role1.equals(role3)).toBeFalse();
    });
});
