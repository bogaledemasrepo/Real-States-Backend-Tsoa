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

# ... (Previous build stages) ...

FROM docker.io/oven/bun:1.1-slim AS release
WORKDIR /app

# Copy dependencies and source code
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/generated ./generated
COPY --from=base /app/ ./ 

# Give execution permission to the entrypoint script
RUN chmod +x ./entrypoint.sh

USER bun
EXPOSE 3000

# Use the script to manage the startup sequence
ENTRYPOINT [ "./entrypoint.sh" ]

CMD [ "bun","run","index.ts" ]