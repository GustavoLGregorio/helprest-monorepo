import { AppError } from "@shared/errors";
import { logger } from "@shared/utils/logger";

/**
 * Global error handler. Converts errors to structured JSON responses.
 */
export function handleError(error: unknown, requestId: string): Response {
    if (error instanceof AppError) {
        logger.warn(error.message, {
            requestId,
            statusCode: error.statusCode,
            name: error.name,
        });

        return Response.json(
            {
                error: error.name,
                message: error.message,
                statusCode: error.statusCode,
                ...(error.name === "ValidationError" && "errors" in error
                    ? { errors: (error as { errors: unknown }).errors }
                    : {}),
            },
            { status: error.statusCode },
        );
    }

    // Unexpected errors
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Unhandled error", {
        requestId,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
    });

    return Response.json(
        {
            error: "InternalServerError",
            message: process.env.NODE_ENV === "production"
                ? "Internal server error"
                : message,
            statusCode: 500,
        },
        { status: 500 },
    );
}
