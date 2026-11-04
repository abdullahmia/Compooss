# Build stage
FROM oven/bun:1-alpine AS builder

ARG VERSION=1.1.0

WORKDIR /app

# Copy workspace and lockfile
COPY package.json bun.lock ./

# Copy package manifests for all workspaces (needed for bun install)
COPY apps/compooss/package.json ./apps/compooss/
COPY apps/docs/package.json ./apps/docs/
COPY apps/desktop/package.json ./apps/desktop/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy full source
COPY . .

# Build the compooss app (turbo builds @compooss/types, @compooss/ui first)
RUN bunx turbo run build --filter=@compooss/app

# Production stage - minimal image with standalone Next.js output
FROM oven/bun:1-alpine AS runner

ARG VERSION=1.1.0
LABEL org.opencontainers.image.version="${VERSION}"

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/apps/compooss/.next/standalone ./
COPY --from=builder /app/apps/compooss/.next/static ./apps/compooss/.next/static
COPY --from=builder /app/apps/compooss/public ./apps/compooss/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone server lives at apps/compooss/server.js
CMD ["node", "apps/compooss/server.js"]
