# Docker Compose Templates

## Local Development (`docker-compose.yml`)

Used for local development with mounted source code and hot-reloading:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: helprest-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: helprest
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: helprest-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    image: oven/bun:1-alpine
    container_name: helprest-api
    working_dir: /usr/src/app
    restart: unless-stopped
    command: sh -c "bun install && bun run dev"
    ports:
      - "3000:3000"
    volumes:
      - ./helprest-api:/usr/src/app
      - /usr/src/app/node_modules
    env_file:
      - .env
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGODB_URI=mongodb://root:password@mongodb:27017/helprest?authSource=admin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
```

## Production Simulation (`docker-compose.prd.yml`)

Used for testing production Docker builds locally prior to Render deployment:

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./helprest-api
      dockerfile: Dockerfile
    container_name: helprest-api-prd
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=3000
```
