// Test setup file — preloaded by Bun test runner
// Sets environment variables for isolated test runs

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.MONGODB_URI = "mongodb://localhost:27017/helprest-test";
process.env.REDIS_URL = "redis://localhost:6379/1";
