# Stage 1: Build
FROM docker.io/oven/bun:1.3.3 AS base
WORKDIR /app

# Install dependencies using the lockfile for consistency
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy everything from your root directory
COPY . .

# Generate the routes and swagger spec inside the container
RUN bun run build

# Stage 2: Production Release
FROM docker.io/oven/bun:1.1-slim AS release
WORKDIR /app

# Copy only what's needed to run
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/generated ./generated
COPY --from=base /app/*.ts ./
COPY --from=base /app/*.json ./
COPY --from=base /app/controllers ./controllers
COPY --from=base /app/db ./db
COPY --from=base /app/models ./models
COPY --from=base /app/exceptions ./exceptions
COPY --from=base /app/services ./services

CMD [ "bun","run","seed.ts" ]
USER bun
EXPOSE 3000

ENTRYPOINT [ "bun", "run", "index.ts" ]