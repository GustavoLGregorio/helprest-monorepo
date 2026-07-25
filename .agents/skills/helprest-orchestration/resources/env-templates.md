# Environment Variable Templates

## Root Environment File (`.env`)

Template file located at `.env.example` in the monorepo root:

```env
# MongoDB Credentials & API Keys
MONGODB_PUBLIC_KEY="your-mongodb-public-key"
MONGODB_PRIVATE_KEY="your-mongodb-private-key"

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Connection Strings (Local Defaults)
MONGODB_URI=mongodb://root:password@localhost:27017/helprest?authSource=admin
REDIS_URL=redis://localhost:6379

# Cryptography & JWT Security
JWT_SECRET=your-jwt-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-at-least-32-characters-long
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth2 Credentials
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# CORS Configuration
CORS_ORIGINS=*

# Mobile App Public API Endpoint URL
# Use http://10.0.2.2:3000 for Android Emulator
# Use http://localhost:3000 for iOS Simulator or Web
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```
