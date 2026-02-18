# Stage 1: Build
FROM oven/bun:1.1 as base
WORKDIR /app

# Install dependencies using the lockfile for consistency
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy everything from your root directory
COPY . .

# Stage 2: Production Release
FROM oven/bun:1.1-slim as release
WORKDIR /app

# Copy only what's needed to run
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/*.ts ./
COPY --from=base /app/*.json ./
# If you have other folders like 'controllers' or 'db', copy them too:
COPY --from=base /app/controllers ./controllers
COPY --from=base /app/db ./db
COPY --from=base /app/services ./services

USER bun
EXPOSE 3000

# Replace 'app.ts' with your actual entry file name
ENTRYPOINT [ "bun", "run", "index.ts" ]