import { Elysia } from "elysia";
import { AppError, ValidationError } from "@shared/errors";
import { logger } from "@shared/utils/logger";

export const errorPlugin = new Elysia({ name: "error-plugin" })
    .onError({ as: "global" }, ({ error, code, set }) => {
        // Domain custom operational errors extending AppError
        if (error instanceof ValidationError) {
            set.status = error.statusCode;
            return {
                error: error.name,
                message: error.message,
                details: error.errors,
            };
        }

        if (error instanceof AppError) {
            set.status = error.statusCode;
            return {
                error: error.name,
                message: error.message,
            };
        }

        // Native Elysia validation errors
        if (code === "VALIDATION") {
            set.status = 400;
            return {
                error: "ValidationError",
                message: "Invalid request parameters or payload",
                details: error.all ?? null,
            };
        }

        // Native Elysia 404
        if (code === "NOT_FOUND") {
            set.status = 404;
            return {
                error: "NotFoundError",
                message: "Requested endpoint or resource was not found",
            };
        }

        // Log unhandled server errors
        logger.error("Unhandled API error", { error: error instanceof Error ? error.message : String(error) });
        set.status = 500;
        return {
            error: "InternalServerError",
            message: "An unexpected server error occurred",
        };
    });
