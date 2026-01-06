# Multi-stage Docker build for Next.js application
# Optimized for Google Cloud Run deployment

# Stage 1: Base image with all dependencies
FROM node:18-alpine AS base
# Install required libraries for Prisma and SSL support
RUN apk add --no-cache libc6-compat openssl openssl-dev ca-certificates
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Configure npm for better network handling and install dependencies
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 60000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy all source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Install runtime dependencies including SSL libraries for Prisma
RUN apk add --no-cache openssl openssl-dev ca-certificates libc6-compat

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files and install ONLY Prisma CLI for migrations
COPY --from=builder /app/package*.json ./
RUN npm install prisma --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/public ./public

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy startup script with proper permissions
COPY start.sh ./start.sh
RUN chmod +x ./start.sh && chown nextjs:nodejs ./start.sh

# Switch to non-root user
USER nextjs

# Expose Cloud Run port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Run startup script that starts the app
CMD ["sh", "./start.sh"]
