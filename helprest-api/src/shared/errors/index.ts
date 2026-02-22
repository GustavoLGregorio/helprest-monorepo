export class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, id?: string) {
        const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}

export class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;

    constructor(message: string, errors: Record<string, string[]> = {}) {
        super(message, 400);
        this.errors = errors;
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

export class RateLimitError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429);
    }
}
