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

# Expose default port (Render dynamically overrides PORT)
EXPOSE 3000

# Health check endpoint verification
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun run -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the app as non-root "bun" user for security
USER bun

# Start application
CMD ["bun", "run", "start"]
