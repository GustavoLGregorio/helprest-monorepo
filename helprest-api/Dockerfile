# Use the official Bun image as the base
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Stage 1: Install production dependencies
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
# Install with --production to exclude devDependencies
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Stage 2: Create the final production image
FROM base AS release
# Copy the installed node_modules from the temp directory
COPY --from=install /temp/prod/node_modules node_modules

# Copy app source code and necessary config files
COPY src/ ./src/
COPY package.json .
COPY tsconfig.json .

# Define production environment
ENV NODE_ENV=production

# Render automatically assigns the PORT environment variable.
# We expose a default of 3000 here for local testing or fallback.
EXPOSE 3000

# Run the app as a non-root "bun" user for security
USER bun

# Start the application using properly structured CMD
CMD ["bun", "run", "start"]
