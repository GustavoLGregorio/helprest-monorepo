import "./polyfill";

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { errorPlugin } from "@interface/plugins/error.plugin";
import { securityPlugin } from "@interface/plugins/security.plugin";
import { authPlugin } from "@interface/plugins/auth.plugin";
import { authModule } from "@interface/modules/auth.module";
import { userModule } from "@interface/modules/user.module";
import { establishmentModule } from "@interface/modules/establishment.module";
import { productModule } from "@interface/modules/product.module";
import { flagModule } from "@interface/modules/flag.module";
import { visitModule } from "@interface/modules/visit.module";
import { favoriteModule } from "@interface/modules/favorite.module";
import { adminModule } from "@interface/modules/admin.module";

export const createApp = () => {
    return new Elysia()
        .use(
            swagger({
                path: "/swagger",
                documentation: {
                    info: {
                        title: "HelpRest API",
                        description: "RESTful API for dietary restriction discovery, establishments, menus, visits and social recommendations",
                        version: "1.0.0",
                    },
                    tags: [
                        { name: "Auth", description: "Authentication & OAuth2 endpoints" },
                        { name: "User", description: "User profile and dietary preferences" },
                        { name: "Establishments", description: "Establishment search, discovery, and management" },
                        { name: "Products", description: "Establishment menu items and food catalog" },
                        { name: "Flags", description: "Dietary restriction and accessibility flags" },
                        { name: "Visits", description: "Visits, reviews, and geofenced photo uploads" },
                        { name: "Social", description: "Social activity feeds and discovery" },
                        { name: "Favorites", description: "User favorites management" },
                        { name: "Admin", description: "Administrative analytics, dashboard, and system management" },
                    ],
                },
            })
        )
        .use(cors())
        .use(securityPlugin)
        .use(errorPlugin)
        .use(authPlugin)
        .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }), {
            detail: {
                summary: "Health Check",
                tags: ["System"],
            },
        })
        .use(authModule)
        .use(userModule)
        .use(establishmentModule)
        .use(productModule)
        .use(flagModule)
        .use(visitModule)
        .use(favoriteModule)
        .use(adminModule);
};

export const app = createApp();
export type App = typeof app;
