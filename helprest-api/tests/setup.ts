// Test setup file — preloaded by Bun test runner
// Sets environment variables for isolated test runs

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

// Dynamically target the test database based on current environment connection URIs
if (process.env.MONGODB_URI) {
    process.env.MONGODB_URI = process.env.MONGODB_URI.replace(/\/helprest(\?|$)/, "/helprest-test$1");
} else {
    process.env.MONGODB_URI = "mongodb://localhost:27017/helprest-test";
}

if (process.env.REDIS_URL) {
    // Redirect to database index 1 for Redis tests to prevent cache collision
    try {
        const url = new URL(process.env.REDIS_URL);
        url.pathname = "/1";
        process.env.REDIS_URL = url.toString();
    } catch {
        process.env.REDIS_URL = "redis://localhost:6379/1";
    }
} else {
    process.env.REDIS_URL = "redis://localhost:6379/1";
}
